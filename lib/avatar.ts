// The athlete's photo from their login (Google puts it in user_metadata as avatar_url or
// picture). Only https addresses are used; anything else shows the silhouette.
export function avatarFromClaims(claims: Record<string, unknown> | null | undefined): string | null {
  const meta = claims?.user_metadata as Record<string, unknown> | undefined;
  for (const key of ["avatar_url", "picture"]) {
    const value = meta?.[key];
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:") return url.toString();
    } catch {
      // not a URL
    }
  }
  return null;
}
