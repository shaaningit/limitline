import { describe, expect, it } from "vitest";
import { utcToZonedLocal, zonedLocalToUtc } from "./time";

describe("zonedLocalToUtc", () => {
  it.each([
    ["2026-11-22T07:30", "UTC", "2026-11-22T07:30:00.000Z"],
    ["2026-11-22T07:30", "Europe/London", "2026-11-22T07:30:00.000Z"], // GMT in November
    ["2026-11-22T07:30", "Europe/Berlin", "2026-11-22T06:30:00.000Z"],
    ["2026-11-22T07:30", "America/New_York", "2026-11-22T12:30:00.000Z"],
    ["2026-11-22T07:30", "Asia/Kolkata", "2026-11-22T02:00:00.000Z"],
    ["2026-07-10T07:30", "Europe/London", "2026-07-10T06:30:00.000Z"], // BST in summer
    ["2026-11-23T00:15", "Australia/Sydney", "2026-11-22T13:15:00.000Z"],
  ])("%s in %s", (local, zone, iso) => {
    expect(zonedLocalToUtc(local, zone)?.toISOString()).toBe(iso);
  });

  it("rejects malformed input", () => {
    expect(zonedLocalToUtc("22/11/2026 07:30", "UTC")).toBeNull();
  });

  it("round-trips with utcToZonedLocal", () => {
    const at = zonedLocalToUtc("2026-11-29T18:05", "Asia/Kolkata")!;
    expect(utcToZonedLocal(at, "Asia/Kolkata")).toBe("2026-11-29T18:05");
  });
});
