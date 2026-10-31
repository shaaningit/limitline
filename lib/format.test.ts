import { describe, expect, it } from "vitest";
import { describeResult, formatPercent, formatValue } from "./format";

describe("formatValue", () => {
  it.each([
    ["run5k", 1558, "25:58"],
    ["run10k", 3723, "1:02:03"],
    ["swim400", 365, "6:05"],
    ["bike20", 251.4, "251 W"],
  ] as const)("%s %d -> %s", (quest, value, expected) => {
    expect(formatValue(quest, value)).toBe(expected);
  });
});

describe("formatPercent", () => {
  it("adds a plus sign for gains and keeps one decimal", () => {
    expect(formatPercent(3.3)).toBe("+3.3%");
    expect(formatPercent(-1.25)).toBe("-1.3%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("describeResult (screen readers)", () => {
  it("reads a doubled pass in full words", () => {
    expect(describeResult(3.3, true, true)).toBe("3.3 percent beyond your limit, double embers");
  });
  it("reads a miss without a minus sign", () => {
    expect(describeResult(-0.8, false, false)).toBe("0.8 percent short of your limit");
  });
  it("explains a first result", () => {
    expect(describeResult(null, false, false)).toBe("Quest done, this sets your first limit");
  });
});
