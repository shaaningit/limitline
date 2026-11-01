// Turning a strava.app.link share link into a Strava activity number.

// The activity number in a redirect address or a page that points to the activity.
export function activityIdIn(text: string | null): string | null {
  const m = (text ?? "").match(/strava\.com\/activities\/(\d{1,20})/);
  return m ? m[1] : null;
}

// Follows the share link one step (it lives on strava.app.link, a link service, not on
// Strava's site) and reads where it points. Returns null when that fails; the founder then
// opens the link by hand, as before.
export async function resolveShortLink(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "strava.app.link") return null; // never fetch anything else
  try {
    const res = await fetch(parsed, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(4000) });
    const fromRedirect = activityIdIn(res.headers.get("location"));
    if (fromRedirect) return fromRedirect;
    if (!res.ok) return null;
    const body = (await res.text()).slice(0, 200_000);
    return activityIdIn(body);
  } catch {
    return null;
  }
}
