import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { deauthorize, exchangeCode } from "@/lib/strava/api";
import { STATE_COOKIE, stravaEnabled } from "@/lib/strava/config";
import { hasActivityScope, saveConnection } from "@/lib/strava/connection";
import { safeReturnPath } from "@/lib/strava/return-path";

// Strava sends the athlete back here with a one-time code (or a refusal). The code becomes
// tokens, stored where only the server can read them (strava_connections).
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(STATE_COOKIE)?.value ?? "{}");
  } catch {
    // A bad cookie is treated like a missing one.
  }
  const next = safeReturnPath(saved.next);
  const back = (status: string) => {
    const url = new URL(next, origin);
    url.searchParams.set("strava", status);
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, "", { path: "/strava", maxAge: 0 });
    return response;
  };

  const session = await getSession();
  if (!session?.profile) return NextResponse.redirect(new URL("/login", origin));
  if (!stravaEnabled()) return back("off");
  if (searchParams.get("error")) return back("denied");
  const code = searchParams.get("code");
  if (!code || !saved.state || searchParams.get("state") !== saved.state) return back("expired");
  const scope = searchParams.get("scope");
  if (!hasActivityScope(scope)) return back("scope");

  try {
    const tokens = await exchangeCode(code);
    const result = await saveConnection(createAdminClient(), session.userId, tokens, scope!);
    if (result === "taken") {
      await deauthorize(tokens.access_token).catch(() => undefined);
      return back("taken");
    }
  } catch {
    return back("failed");
  }
  return back("connected");
}
