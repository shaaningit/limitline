import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/data/session";
import { authorizeUrl } from "@/lib/strava/api";
import { STATE_COOKIE, STRAVA_SCOPE, stravaEnabled } from "@/lib/strava/config";
import { safeReturnPath } from "@/lib/strava/return-path";

// "Connect Strava": sends the athlete to Strava to say yes. A random state value, kept in a
// short-lived cookie, proves the answer that comes back belongs to this request.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const session = await getSession();
  if (!session?.profile) return NextResponse.redirect(new URL("/login", origin));
  const next = safeReturnPath(searchParams.get("next"));
  if (!stravaEnabled()) return NextResponse.redirect(new URL(`${next}?strava=off`, origin));

  const state = crypto.randomUUID();
  const mobile = /Android|iPhone|iPad|iPod/i.test(request.headers.get("user-agent") ?? "");
  const response = NextResponse.redirect(authorizeUrl({ state, mobile, scope: STRAVA_SCOPE }));
  response.cookies.set(STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/strava",
  });
  return response;
}
