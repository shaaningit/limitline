import "server-only";

// Strava checking is on once its keys and the server's secret database key are set (SETUP.md).
// Without them everything still works: links go to the founder's queue as before.
export function stravaEnabled(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID &&
      process.env.STRAVA_CLIENT_SECRET &&
      process.env.SUPABASE_SECRET_KEY &&
      process.env.APP_URL,
  );
}

// activity:read lets the app read the athlete's Everyone and Followers activities, nothing more.
export const STRAVA_SCOPE = "read,activity:read";

// Short-lived cookie that ties Strava's answer to the request that asked (OAuth "state").
export const STATE_COOKIE = "strava_oauth";
