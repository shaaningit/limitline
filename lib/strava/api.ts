import "server-only";
import type { StravaActivity, StravaLap, WattsStream } from "./check";
import { StravaError } from "./errors";

export { StravaError };

// Strava's official API (developers.strava.com). Every call has a time limit so a slow
// Strava never blocks an athlete for long; on any failure the entry goes to the founder.
const API = "https://www.strava.com/api/v3";
const OAUTH = "https://www.strava.com/oauth";
const TIMEOUT_MS = 6000;

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new StravaError(0, "Couldn't reach Strava");
  }
  if (!res.ok) throw new StravaError(res.status, `Strava answered ${res.status}`);
  return (await res.json()) as T;
}

const get = <T>(token: string, path: string) => call<T>(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });

// ---------- Connecting an athlete (OAuth) ----------

export function authorizeUrl(opts: { state: string; mobile: boolean; scope: string }): string {
  // The mobile page hands over to the Strava app when it's installed (no password typing).
  const base = opts.mobile ? `${OAUTH}/mobile/authorize` : `${OAUTH}/authorize`;
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: opts.scope,
    state: opts.state,
  });
  return `${base}?${params}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete?: { id: number; firstname?: string; lastname?: string };
}

function tokenRequest(fields: Record<string, string>) {
  return call<TokenResponse>(`${OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      ...fields,
    }),
  });
}

export const exchangeCode = (code: string) => tokenRequest({ code, grant_type: "authorization_code" });
// Strava may hand back a new refresh token each time; always store the latest.
export const refreshTokens = (refreshToken: string) => tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });

export async function deauthorize(accessToken: string): Promise<void> {
  await call(`${OAUTH}/deauthorize`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: accessToken }),
  });
}

// ---------- Reading activities ----------

export const getActivity = (token: string, id: string) => get<StravaActivity>(token, `/activities/${encodeURIComponent(id)}`);

export async function getWattsStream(token: string, id: string): Promise<WattsStream | null> {
  const streams = await get<Record<string, { data: number[] } | undefined>>(
    token,
    `/activities/${encodeURIComponent(id)}/streams?keys=time,watts&key_by_type=true`,
  );
  const time = streams.time?.data;
  const watts = streams.watts?.data;
  return time && watts ? { time, watts } : null;
}

export const getLaps = (token: string, id: string) => get<StravaLap[]>(token, `/activities/${encodeURIComponent(id)}/laps`);
