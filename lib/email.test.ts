import { afterEach, describe, expect, it, vi } from "vitest";
import { correctionEmail, resultEmail, sendEmail } from "./email";

describe("resultEmail", () => {
  it("leads with the limit-beating result and double embers", () => {
    const m = resultEmail("a@example.com", {
      questId: "run5k",
      status: "verified",
      value: 1558,
      percent: 3.3,
      beatLimit: true,
      embers: 20,
      rejectReason: null,
    });
    expect(m.subject).toBe("You beat your Run 5 km limit: +3.3%");
    expect(m.text).toContain("You beat your Run 5 km limit: 25:58, +3.3%, double embers.");
  });

  it("sends a short note for a completed quest", () => {
    const m = resultEmail("a@example.com", {
      questId: "bike20",
      status: "verified",
      value: 240,
      percent: -2,
      beatLimit: false,
      embers: 10,
      rejectReason: null,
    });
    expect(m.subject).toBe("Quest done: Bike 20-min power");
    expect(m.text).toContain("Quest done: Bike 20-min power in 240 W. +10 embers.");
  });
});

describe("correctionEmail", () => {
  it("explains embers going down", () => {
    const m = correctionEmail(
      "a@example.com",
      { questId: "run5k", status: "verified", value: 1578, percent: 2.1, beatLimit: true, embers: 10, rejectReason: null },
      20,
    );
    expect(m.text).toContain("Embers: 20 → 10.");
  });

  it("explains a rejection with the reason", () => {
    const m = correctionEmail(
      "a@example.com",
      { questId: "run5k", status: "rejected", value: null, percent: null, beatLimit: null, embers: null, rejectReason: "not_own" },
      20,
    );
    expect(m.text).toContain("it no longer counts (This activity isn't yours)");
    expect(m.text).toContain("Embers: 20 → 0.");
  });
});

describe("sendEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports failure instead of throwing when the service errors", async () => {
    vi.stubEnv("RESEND_API_KEY", "test");
    vi.stubEnv("EMAIL_FROM", "LIMITLINE <hello@example.com>");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(sendEmail({ to: "a@example.com", subject: "s", text: "t" })).resolves.toBe(false);
  });

  it("reports failure when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendEmail({ to: "a@example.com", subject: "s", text: "t" })).resolves.toBe(false);
  });

  it("posts to Resend and reports success", async () => {
    vi.stubEnv("RESEND_API_KEY", "test");
    vi.stubEnv("EMAIL_FROM", "LIMITLINE <hello@example.com>");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendEmail({ to: "a@example.com", subject: "s", text: "t" })).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/emails");
  });
});
