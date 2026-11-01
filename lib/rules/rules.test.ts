import { describe, expect, it } from "vitest";
import { EMBERS, QUESTS } from "./config";
import {
  buildBoard,
  cameBack,
  canRedeem,
  embersBalance,
  embersExplainer,
  questRules,
  evaluate,
  evaluateAll,
  limitBefore,
  parseDuration,
  parseStravaLink,
  parseWatts,
  percentBeyond,
  pilotWeek,
  weekStart,
  type BoardInput,
  type Seed,
  type VerifiedEntry,
} from "./index";

const at = (iso: string) => new Date(iso);
const entry = (id: string, questId: VerifiedEntry["questId"], value: number, iso: string): VerifiedEntry => ({
  id,
  questId,
  value,
  activityAt: at(iso),
});

describe("parseStravaLink", () => {
  it.each([
    ["https://www.strava.com/activities/12345678", { kind: "activity", activityId: "12345678" }],
    ["https://strava.com/activities/42/", { kind: "activity", activityId: "42" }],
    ["  https://www.strava.com/activities/99?share_sig=abc#x  ", { kind: "activity", activityId: "99" }],
    ["https://strava.app.link/AbCdEf123", { kind: "short", url: "https://strava.app.link/AbCdEf123" }],
    ["https://www.strava.com/athletes/123", { kind: "invalid" }],
    ["https://www.strava.com/activities/abc", { kind: "invalid" }],
    ["https://evil.example/activities/123", { kind: "invalid" }],
    ["https://strava.com.evil.example/activities/123", { kind: "invalid" }],
    ["https://strava.app.link/", { kind: "invalid" }],
    ["not a link", { kind: "invalid" }],
    ["javascript:alert(1)", { kind: "invalid" }],
  ])("%s", (input, expected) => {
    expect(parseStravaLink(input)).toEqual(expected);
  });
});

describe("admin input validation", () => {
  it("accepts a normal 5 km time", () => {
    expect(parseDuration(0, 25, 58)).toEqual({ ok: true, value: 1558 });
  });
  it.each([
    [0, 60, 0],
    [0, 25, 60],
    [10, 0, 0],
    [0, 0, 0],
    [0, -1, 5],
    [0, 25.5, 0],
  ])("rejects %i h %i m %i s", (h, m, s) => {
    expect(parseDuration(h, m, s).ok).toBe(false);
  });
  it.each([
    [250, true],
    [50, true],
    [2000, true],
    [49, false],
    [2001, false],
    [250.5, false],
  ])("watts %d -> ok %s", (w, ok) => {
    expect(parseWatts(w).ok).toBe(ok);
  });
});

describe("percentBeyond", () => {
  it("time quests: faster is positive", () => {
    // 26:52 limit, 25:58 result -> 54/1612 = 3.3499% -> 3.3 (the plan's "+3.4%" example was rounded by hand)
    expect(percentBeyond("run5k", 1612, 1558)).toBe(3.3);
  });
  it("time quests: slower is negative", () => {
    expect(percentBeyond("swim400", 400, 410)).toBe(-2.5);
  });
  it("power quests: more watts is positive", () => {
    expect(percentBeyond("bike20", 250, 260)).toBe(4);
  });
});

describe("limitBefore", () => {
  const seed: Seed = { questId: "run5k", value: 1612, effortCount: 4 };
  const history = [
    entry("a", "run5k", 1600, "2026-11-17T07:00:00Z"),
    entry("b", "run5k", 1590, "2026-11-20T07:00:00Z"),
    entry("c", "run10k", 3300, "2026-11-18T07:00:00Z"),
  ];

  it("uses the seed when there is no earlier entry", () => {
    expect(limitBefore("run5k", seed, history, at("2026-11-16T07:00:00Z"))).toEqual({
      limit: 1612,
      effortCount: 4,
      entriesBefore: 0,
    });
  });
  it("only counts entries of the same quest recorded strictly earlier", () => {
    expect(limitBefore("run5k", seed, history, at("2026-11-20T07:00:00Z"))).toEqual({
      limit: 1600,
      effortCount: 5,
      entriesBefore: 1,
    });
  });
  it("has no limit without a seed or entries", () => {
    expect(limitBefore("swim400", undefined, history, at("2026-11-30T07:00:00Z"))).toEqual({
      limit: null,
      effortCount: 0,
      entriesBefore: 0,
    });
  });
  it("keeps the higher watts for the bike quest", () => {
    const bike = [entry("x", "bike20", 240, "2026-11-17T07:00:00Z"), entry("y", "bike20", 230, "2026-11-18T07:00:00Z")];
    expect(limitBefore("bike20", undefined, bike, at("2026-11-19T07:00:00Z")).limit).toBe(240);
  });
});

describe("evaluate: embers and the double-check", () => {
  const seed: Seed = { questId: "run5k", value: 1612, effortCount: 4 };

  it("beat limit with 4+ efforts earns double, and the first pilot result needs a confirm click", () => {
    const e = entry("1", "run5k", 1558, "2026-11-17T07:00:00Z");
    expect(evaluate(e, seed, [e])).toEqual({
      limitBefore: 1612,
      percent: 3.3,
      beatLimit: true,
      doublingUnlocked: true,
      embers: EMBERS.base * EMBERS.beatMultiplier,
      needsConfirm: true,
    });
  });

  it("completing without beating the limit earns base embers", () => {
    const first = entry("1", "run5k", 1558, "2026-11-17T07:00:00Z");
    const second = entry("2", "run5k", 1620, "2026-11-19T07:00:00Z");
    const result = evaluate(second, seed, [first, second]);
    expect(result.beatLimit).toBe(false);
    expect(result.embers).toBe(EMBERS.base);
    expect(result.needsConfirm).toBe(false);
  });

  it("beating the limit before 4 efforts earns base only", () => {
    const smallSeed: Seed = { questId: "run5k", value: 1612, effortCount: 2 };
    const e = entry("1", "run5k", 1558, "2026-11-17T07:00:00Z");
    const result = evaluate(e, smallSeed, [e]);
    expect(result.beatLimit).toBe(true);
    expect(result.doublingUnlocked).toBe(false);
    expect(result.embers).toBe(EMBERS.base);
  });

  it("an unusually big jump needs a confirm click (D17)", () => {
    const earlier = entry("1", "run5k", 1600, "2026-11-17T07:00:00Z");
    const typo = entry("2", "run5k", 178, "2026-11-19T07:00:00Z"); // 2:58 typed instead of 25:58
    expect(evaluate(typo, seed, [earlier, typo]).needsConfirm).toBe(true);
  });

  it("with no limit at all, the first result sets it and earns base", () => {
    const e = entry("1", "swim400", 420, "2026-11-17T07:00:00Z");
    const result = evaluate(e, undefined, [e]);
    expect(result).toMatchObject({ limitBefore: null, percent: null, beatLimit: false, embers: EMBERS.base });
  });
});

describe("evaluateAll: corrections recompute later results", () => {
  const seed: Seed = { questId: "run5k", value: 1612, effortCount: 4 };

  it("fixing a typo restores the later entry's pass", () => {
    const typo = entry("1", "run5k", 178, "2026-11-17T07:00:00Z");
    const later = entry("2", "run5k", 1550, "2026-11-20T07:00:00Z");
    expect(evaluateAll([later, typo], [seed]).get("2")!.beatLimit).toBe(false);

    const fixed = { ...typo, value: 1578 };
    const after = evaluateAll([later, fixed], [seed]).get("2")!;
    expect(after.limitBefore).toBe(1578);
    expect(after.beatLimit).toBe(true);
  });
});

describe("embers balance and shop", () => {
  it("can go below zero after a correction, which locks the shop (D3)", () => {
    expect(embersBalance([20, 10], [40])).toEqual({ balance: -10, shopLocked: true });
  });
  it("redeems only with enough embers", () => {
    expect(canRedeem(40, 40)).toBe(true);
    expect(canRedeem(39, 40)).toBe(false);
    expect(canRedeem(-5, 0)).toBe(false);
  });
});

describe("weeks", () => {
  it("Sunday 23:59 and Monday 00:00 fall in different weeks in the pilot time zone", () => {
    expect(weekStart(at("2026-11-22T23:59:00Z"), "Europe/London")).toBe("2026-11-16");
    expect(weekStart(at("2026-11-23T00:00:00Z"), "Europe/London")).toBe("2026-11-23");
  });
  it("uses the pilot time zone, not UTC", () => {
    // 01:00 Monday in Berlin is still Sunday in UTC
    expect(weekStart(at("2026-11-23T00:30:00Z"), "Europe/Berlin")).toBe("2026-11-23");
    expect(weekStart(at("2026-11-22T23:30:00Z"), "Europe/Berlin")).toBe("2026-11-23");
    expect(weekStart(at("2026-11-22T23:30:00Z"), "UTC")).toBe("2026-11-16");
  });
  it("counts pilot weeks from the start week", () => {
    const start = at("2026-11-16T09:00:00Z");
    expect(pilotWeek(at("2026-11-18T09:00:00Z"), start, "UTC")).toBe(1);
    expect(pilotWeek(at("2026-12-01T09:00:00Z"), start, "UTC")).toBe(3);
    expect(pilotWeek(at("2026-12-13T09:00:00Z"), start, "UTC")).toBe(4);
  });
  it("'came back' needs activity in BOTH week 3 and week 4 (D20)", () => {
    const start = at("2026-11-16T09:00:00Z");
    expect(cameBack([at("2026-12-01T09:00:00Z"), at("2026-12-08T09:00:00Z")], start, "UTC")).toBe(true);
    expect(cameBack([at("2026-12-08T09:00:00Z")], start, "UTC")).toBe(false);
  });
});

describe("buildBoard (D16, 3A)", () => {
  const base = { activityAt: at("2026-11-18T07:00:00Z"), showOnBoards: true };
  const rows: BoardInput[] = [
    { ...base, athleteId: "priya", displayName: "Priya R.", questId: "run5k", percent: 3.4, beatLimit: true },
    { ...base, athleteId: "priya", displayName: "Priya R.", questId: "run10k", percent: 1.2, beatLimit: true },
    { ...base, athleteId: "dana", displayName: "Dana K.", questId: "run10k", percent: 2.9, beatLimit: true },
    { ...base, athleteId: "sam", displayName: "Sam O.", questId: "run5k", percent: -1, beatLimit: false },
    { ...base, athleteId: "lee", displayName: "Lee W.", questId: "run5k", percent: 5.0, beatLimit: true, showOnBoards: false },
    { ...base, athleteId: "marco", displayName: "Marco T.", questId: "bike20", percent: 5.1, beatLimit: true },
  ];

  it("ranks each athlete's best % on the sport's board, never exposing raw values", () => {
    const board = buildBoard(rows, "run", "2026-11-16", "UTC");
    expect(board.rows).toEqual([
      { rank: 1, athleteId: "priya", displayName: "Priya R.", questLabel: QUESTS.run5k.label, percent: 3.4 },
      { rank: 2, athleteId: "dana", displayName: "Dana K.", questLabel: QUESTS.run10k.label, percent: 2.9 },
    ]);
    expect(Object.keys(board.rows[0])).not.toContain("value");
  });
  it("counts athletes who completed quests without a pass, and leaves out hidden athletes", () => {
    expect(buildBoard(rows, "run", "2026-11-16", "UTC").othersCompleted).toBe(1); // Sam; Lee is hidden
  });
  it("is empty for a week with no passes", () => {
    expect(buildBoard(rows, "swim", "2026-11-16", "UTC")).toEqual({ rows: [], othersCompleted: 0 });
  });
});

describe("embersExplainer (8A)", () => {
  it("reads its numbers from config", () => {
    const lines = embersExplainer();
    expect(lines[0]).toContain(String(EMBERS.base));
    expect(lines[1]).toContain(String(EMBERS.base * EMBERS.beatMultiplier));
    expect(lines[2]).toContain(String(EMBERS.minEffortsToDouble));
  });
});

describe("questRules (longer counts, shorter is rejected)", () => {
  it("times a longer run on the quest distance", () => {
    const r = questRules("run5k");
    expect(r.counts).toContain("5 km or longer");
    expect(r.timedOn).toContain("fastest 5 km");
    expect(r.rejected).toContain("Shorter than 5 km");
  });
  it("uses metres for swims and minutes for the power quest", () => {
    expect(questRules("swim400").counts).toContain("pool swim of 400 m");
    expect(questRules("swim1500").rejected).toContain("Shorter than 1500 m");
    expect(questRules("bike20").counts).toContain("20 minutes or more");
  });
});
