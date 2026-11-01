// Where to send the athlete after connecting Strava: only a path inside this app.
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/profile";
  return raw.split(/[?#]/)[0] || "/profile";
}
