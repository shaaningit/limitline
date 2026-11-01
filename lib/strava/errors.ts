// A failed Strava call: the HTTP status, or 0 when Strava couldn't be reached.
export class StravaError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
