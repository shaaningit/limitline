import { describe, expect, it } from "vitest";
import { EMBERS } from "@/lib/rules/config";
import { planChange, type DbEntry } from "./plan";

const now = new Date("2026-11-21T10:00:00Z");
const seeds = [{ questId: "run5k" as const, value: 1612, effortCount: 4 }];

const waiting = (id: string): DbEntry => ({
  id,
  quest_id: "run5k",
  status: "waiting",
  strava_activity_id: null,
  activity_at: null,
  value: null,
  percent: null,
  beat_limit: null,
  embers: null,
});

const verified = (id: string, value: number, iso: string, percent: number, beat: boolean, embers: number): DbEntry => ({
  id,
  quest_id: "run5k",
  status: "verified",
  strava_activity_id: id,
  activity_at: iso,
  value,
  percent,
  beat_limit: beat,
  embers,
});

describe("planChange", () => {
  it("verifying a new entry writes its result and sends a result email", () => {
    const plan = planChange([waiting("a")], seeds, {
      kind: "verify",
      id: "a",
      questId: "run5k",
      stravaActivityId: "111",
      activityAt: new Date("2026-11-17T07:00:00Z"),
      value: 1558,
    }, now);
    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0]).toMatchObject({ id: "a", status: "verified", percent: 3.3, beat_limit: true, embers: 20, email_status: "pending" });
    expect(plan.notices).toEqual([{ entryId: "a", type: "result" }]);
    expect(plan.preview).toMatchObject({ beatLimit: true, needsConfirm: true });
  });

  it("correcting a typo recomputes the later entry and emails both athletes' changes", () => {
    // 2:58 typo became the limit, so the later honest 25:50 didn't count as a pass.
    const entries = [
      verified("typo", 178, "2026-11-17T07:00:00Z", 89, true, 20),
      verified("later", 1550, "2026-11-20T07:00:00Z", -770.8, false, 10),
    ];
    const plan = planChange(entries, seeds, {
      kind: "verify",
      id: "typo",
      questId: "run5k",
      stravaActivityId: "typo",
      activityAt: new Date("2026-11-17T07:00:00Z"),
      value: 1578,
    }, now);
    const later = plan.rows.find((r) => r.id === "later")!;
    expect(later).toMatchObject({ beat_limit: true, embers: EMBERS.base * EMBERS.beatMultiplier });
    expect(plan.notices).toEqual([
      { entryId: "typo", type: "correction" },
      { entryId: "later", type: "correction" },
    ]);
  });

  it("rejecting a verified entry clears its embers and recomputes later results", () => {
    const entries = [
      verified("fake", 1400, "2026-11-17T07:00:00Z", 13.2, true, 20),
      verified("real", 1590, "2026-11-20T07:00:00Z", -13.6, false, 10),
    ];
    const plan = planChange(entries, seeds, { kind: "reject", id: "fake", reason: "not_own" }, now);
    expect(plan.rows[0]).toMatchObject({ id: "fake", status: "rejected", reject_reason: "not_own", embers: null });
    expect(plan.rows.find((r) => r.id === "real")).toMatchObject({ beat_limit: true, percent: 1.4 });
    expect(plan.notices.map((n) => n.type)).toEqual(["correction", "correction"]);
  });

  it("rejecting a waiting entry sends no email and touches nothing else", () => {
    const plan = planChange([waiting("a"), verified("b", 1600, "2026-11-17T07:00:00Z", 0.7, true, 20)], seeds, {
      kind: "reject",
      id: "a",
      reason: "cant_view",
    }, now);
    expect(plan.rows).toHaveLength(1);
    expect(plan.notices).toEqual([]);
  });

  it("unchanged later results are not rewritten", () => {
    const entries = [verified("b", 1600, "2026-11-17T07:00:00Z", 0.7, true, 20), waiting("c")];
    const plan = planChange(entries, seeds, {
      kind: "verify",
      id: "c",
      questId: "run5k",
      stravaActivityId: "333",
      activityAt: new Date("2026-11-20T07:00:00Z"),
      value: 1620,
    }, now);
    expect(plan.rows.map((r) => r.id)).toEqual(["c"]);
  });
});
