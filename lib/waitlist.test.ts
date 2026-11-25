import { describe, expect, it } from "vitest";
import { normalizeInstagram, parseWaitlist } from "./waitlist";

describe("normalizeInstagram", () => {
  it("strips the @, links and case", () => {
    expect(normalizeInstagram("@Ana.Runs")).toBe("ana.runs");
    expect(normalizeInstagram("https://www.instagram.com/ana.runs/?hl=en")).toBe("ana.runs");
    expect(normalizeInstagram("  ana_runs ")).toBe("ana_runs");
    expect(normalizeInstagram("")).toBe("");
  });
});

describe("parseWaitlist", () => {
  it("accepts an athlete with the minimum", () => {
    const r = parseWaitlist({ email: " Ana@Example.com " });
    expect(r).toEqual({ ok: true, entry: { email: "ana@example.com", name: "", instagram: "", role: "athlete", sport: "", company: "", ref: "" } });
  });
  it("keeps a known sport for athletes and drops unknown ones", () => {
    const good = parseWaitlist({ email: "a@b.co", sport: "triathlon" });
    const bad = parseWaitlist({ email: "a@b.co", sport: "chess" });
    expect(good.ok && good.entry.sport).toBe("triathlon");
    expect(bad.ok && bad.entry.sport).toBe("");
  });
  it("needs a brand name from brands and ignores their sport", () => {
    expect(parseWaitlist({ email: "a@b.co", role: "brand" })).toEqual({ ok: false, error: "Add your brand's name" });
    const r = parseWaitlist({ email: "a@b.co", role: "brand", company: "Trail Co", sport: "run" });
    expect(r.ok && r.entry).toMatchObject({ role: "brand", company: "Trail Co", sport: "" });
  });
  it("rejects bad emails and handles", () => {
    expect(parseWaitlist({ email: "nope" }).ok).toBe(false);
    expect(parseWaitlist({ email: "a@b.co", instagram: "not a handle!" }).ok).toBe(false);
  });
  it("keeps a clean ref code and drops anything else", () => {
    const r1 = parseWaitlist({ email: "a@b.co", ref: "Reel05" });
    const r2 = parseWaitlist({ email: "a@b.co", ref: "<script>" });
    expect(r1.ok && r1.entry.ref).toBe("reel05");
    expect(r2.ok && r2.entry.ref).toBe("");
  });
});
