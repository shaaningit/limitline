import { afterEach, describe, expect, it, vi } from "vitest";
import { activityIdIn, resolveShortLink } from "./short-link";

describe("activityIdIn", () => {
  it("finds the activity number in a redirect or page", () => {
    expect(activityIdIn("https://www.strava.com/activities/16012345678?share_sig=abc")).toBe("16012345678");
    expect(activityIdIn('<meta content="strava://activities/1"><a href="https://strava.com/activities/42">')).toBe("42");
    expect(activityIdIn("https://www.strava.com/athletes/42")).toBeNull();
    expect(activityIdIn(null)).toBeNull();
  });
});

describe("resolveShortLink", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the redirect without following it", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 307, headers: { location: "https://www.strava.com/activities/555" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await resolveShortLink("https://strava.app.link/AbC123")).toBe("555");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });
  it("falls back to the page's link to the activity", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('<a href="https://www.strava.com/activities/777">', { status: 200 })));
    expect(await resolveShortLink("https://strava.app.link/AbC123")).toBe("777");
  });
  it("never fetches anything but https://strava.app.link", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await resolveShortLink("https://evil.example/strava.app.link")).toBeNull();
    expect(await resolveShortLink("http://strava.app.link/AbC")).toBeNull();
    expect(await resolveShortLink("not a url")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("gives up quietly when the link service fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await resolveShortLink("https://strava.app.link/AbC123")).toBeNull();
  });
});
