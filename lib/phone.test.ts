import { describe, expect, it } from "vitest";
import { normalizeCode, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("accepts international numbers typed with spaces and dashes", () => {
    expect(normalizePhone("+44 7700 900-123")).toEqual({ ok: true, phone: "+447700900123" });
    expect(normalizePhone(" +91 (98765) 43210 ")).toEqual({ ok: true, phone: "+919876543210" });
  });
  it("turns a leading 00 into +", () => {
    expect(normalizePhone("0044 7700 900123")).toEqual({ ok: true, phone: "+447700900123" });
  });
  it("asks for the country code when it's missing", () => {
    const r = normalizePhone("07700 900123");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("country code");
  });
  it("rejects empty, too short, too long and non-numbers", () => {
    expect(normalizePhone("").ok).toBe(false);
    expect(normalizePhone("+44123").ok).toBe(false);
    expect(normalizePhone("+4412345678901234").ok).toBe(false);
    expect(normalizePhone("+44 call me").ok).toBe(false);
    expect(normalizePhone("+0447700900123").ok).toBe(false);
  });
});

describe("normalizeCode", () => {
  it("accepts 6 digits, with or without a space", () => {
    expect(normalizeCode("123456")).toBe("123456");
    expect(normalizeCode("123 456")).toBe("123456");
  });
  it("rejects anything else", () => {
    expect(normalizeCode("12345")).toBeNull();
    expect(normalizeCode("12345a")).toBeNull();
  });
});
