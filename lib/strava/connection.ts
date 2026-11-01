import "server-only";
import type { AdminClient } from "@/lib/supabase/admin";
import { deauthorize, refreshTokens, StravaError, type TokenResponse } from "./api";

export interface Connection {
  athlete_id: string;
  strava_athlete_id: number;
  strava_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

export async function getConnection(admin: AdminClient, athleteId: string): Promise<Connection | null> {
  const { data, error } = await admin.from("strava_connections").select("*").eq("athlete_id", athleteId).maybeSingle();
  if (error) throw new Error("Couldn't load the Strava connection");
  return (data as Connection | null) ?? null;
}

// Granted scopes come back comma-separated; reading activities needs activity:read (or read_all).
export function hasActivityScope(scope: string | null): boolean {
  const granted = (scope ?? "").split(",").map((s) => s.trim());
  return granted.includes("activity:read") || granted.includes("activity:read_all");
}

// Saves a new connection. One Strava account can belong to only one LIMITLINE athlete.
export async function saveConnection(
  admin: AdminClient,
  athleteId: string,
  tokens: TokenResponse,
  scope: string,
): Promise<"saved" | "taken"> {
  if (!tokens.athlete?.id) throw new StravaError(0, "Strava didn't say which athlete connected");
  const name = [tokens.athlete.firstname, tokens.athlete.lastname].filter(Boolean).join(" ").slice(0, 100) || null;
  const { error } = await admin.from("strava_connections").upsert(
    {
      athlete_id: athleteId,
      strava_athlete_id: tokens.athlete.id,
      strava_name: name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      scope,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "athlete_id" },
  );
  if (error?.code === "23505") return "taken";
  if (error) throw new Error("Couldn't save the Strava connection");
  return "saved";
}

// A usable access token, refreshed when it has under 5 minutes left. If Strava refuses the
// refresh (the athlete revoked access on Strava), the connection is removed.
export async function accessToken(admin: AdminClient, conn: Connection, now: Date): Promise<string> {
  if (new Date(conn.expires_at).getTime() - now.getTime() > 5 * 60 * 1000) return conn.access_token;
  let fresh: TokenResponse;
  try {
    fresh = await refreshTokens(conn.refresh_token);
  } catch (e) {
    if (e instanceof StravaError && (e.status === 400 || e.status === 401)) {
      await admin.from("strava_connections").delete().eq("athlete_id", conn.athlete_id);
    }
    throw e;
  }
  await admin
    .from("strava_connections")
    .update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token,
      expires_at: new Date(fresh.expires_at * 1000).toISOString(),
    })
    .eq("athlete_id", conn.athlete_id);
  return fresh.access_token;
}

// Disconnect: tell Strava to revoke our access (best effort), then forget the tokens.
export async function removeConnection(admin: AdminClient, athleteId: string): Promise<void> {
  const conn = await getConnection(admin, athleteId);
  if (!conn) return;
  try {
    await deauthorize(await accessToken(admin, conn, new Date()));
  } catch {
    // Already revoked on Strava's side, or Strava is down: the tokens are deleted either way.
  }
  await admin.from("strava_connections").delete().eq("athlete_id", athleteId);
}
