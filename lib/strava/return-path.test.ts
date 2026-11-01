import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./return-path";

describe("safeReturnPath", () => {
  it("keeps paths inside the app, without their query", () => {
    expect(safeReturnPath("/quests/run5k")).toBe("/quests/run5k");
    expect(safeReturnPath("/profile?x=1")).toBe("/profile");
  });
  it("refuses anything that could leave the app", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "evil", "", null, undefined]) {
      expect(safeReturnPath(bad)).toBe("/profile");
    }
  });
});
