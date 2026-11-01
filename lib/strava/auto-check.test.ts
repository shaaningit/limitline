import { describe, expect, it } from "vitest";
import type { DbEntry } from "@/lib/data/plan";
import type { Seed } from "@/lib/rules";
import { StravaError } from "./errors";
import { autoCheck, type AutoCheckDeps } from "./auto-check";
import type { StravaActivity } from "./check";

const ATHLETE = "u-a";
const STRAVA_ID = 9001;
const NOW = new Date("2026-11-25T09:00:00Z");

const waiting = (over: Partial<DbEntry> = {}): DbEntry => ({
  id: "e-new",
  quest_id: "run5k",
  status: "waiting",
  strava_activity_id: "777",
  activity_at: null,
  value: null,
  percent: null,
  beat_limit: null,
  embers: null,
  ...over,
});

const verified = (id: string, value: number, at: string): DbEntry => ({
  id,
  quest_id: "run5k",
  status: "verified",
  strava_activity_id: id.replace("e", "9"),
  activity_at: at,
  value,
  percent: 0,
  beat_limit: false,
  embers: 10,
});

function activity(fiveK: number, over: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 777,
    athlete: { id: STRAVA_ID },
    sport_type: "Run",
    start_date: "2026-11-24T07:00:00Z",
    distance: 5100,
    elapsed_time: fiveK + 30,
    moving_time: fiveK + 20,
    trainer: false,
    manual: false,
    start_latlng: [51.5, -0.1],
    best_efforts: [{ name: "5k", elapsed_time: fiveK, distance: 5000 }],
    ...over,
  };
}

function setup(opts: {
  entries?: DbEntry[];
  seeds?: Seed[];
  act?: StravaActivity | Error;
  connected?: boolean;
}) {
  const writes: Record<string, unknown>[][] = [];
  const deps: AutoCheckDeps = {
    connection: async () => (opts.connected === false ? null : { stravaAthleteId: STRAVA_ID, token: async () => "tok" }),
    load: async () => ({
      entries: opts.entries ?? [waiting()],
      seeds: opts.seeds ?? [{ questId: "run5k", value: 1500, effortCount: 6 }],
      signedUpAt: new Date("2026-11-01T00:00:00Z"),
    }),
    strava: {
      getActivity: async () => {
        if (opts.act instanceof Error) throw opts.act;
        return opts.act ?? activity(1485);
      },
      getWattsStream: async () => null,
      getLaps: async () => [],
    },
    write: async (rows) => {
      writes.push(rows);
    },
    now: () => NOW,
  };
  return { deps, writes };
}

describe("autoCheck", () => {
  it("approves a normal result in one write, marked as checked by Strava, with no email for it", async () => {
    const { deps, writes } = setup({});
    const out = await autoCheck(deps, ATHLETE, "e-new");
    expect(out.status).toBe("verified");
    expect(writes).toHaveLength(1);
    const row = writes[0].find((r) => r.id === "e-new")!;
    expect(row).toMatchObject({
      status: "verified",
      value: 1485,
      activity_at: "2026-11-24T07:00:00.000Z",
      strava_activity_id: "777",
      percent: 1, // 1500 -> 1485 is 1.0% beyond the limit
      beat_limit: true,
      embers: 20, // doubled: 6 seed efforts
      checked_by: "strava",
      email_status: null,
    });
    if (out.status === "verified") expect(out.notices).toEqual([]);
  });

  it("rejects a run that's too short, with the reason and a note", async () => {
    const { deps, writes } = setup({ act: activity(1485, { distance: 4800, best_efforts: [] }) });
    const out = await autoCheck(deps, ATHLETE, "e-new");
    expect(out).toMatchObject({ status: "rejected", reason: "not_completed" });
    expect(writes[0][0]).toMatchObject({ id: "e-new", status: "rejected", reject_reason: "not_completed", checked_by: "strava" });
  });

  it("sends a jump of more than 10% to the founder with the numbers filled in, and changes nothing else", async () => {
    const { deps, writes } = setup({ act: activity(1300) }); // 13.3% beyond 1500
    const out = await autoCheck(deps, ATHLETE, "e-new");
    expect(out.status).toBe("founder");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toHaveLength(1);
    const row = writes[0][0];
    expect(row).not.toHaveProperty("status");
    expect(row.suggested).toEqual({
      quest_id: "run5k",
      strava_activity_id: "777",
      activity_at: "2026-11-24T07:00:00.000Z",
      value: 1300,
    });
    expect(String(row.strava_note)).toContain("+13.3%");
  });

  it("auto-approves an athlete's first result for a quest (it sets their first limit)", async () => {
    const { deps } = setup({ seeds: [] });
    expect((await autoCheck(deps, ATHLETE, "e-new")).status).toBe("verified");
  });

  it("goes to the founder with a plain reason when Strava fails", async () => {
    for (const [err, words] of [
      [new StravaError(404, ""), "can't find"],
      [new StravaError(429, ""), "busy"],
      [new StravaError(0, ""), "Couldn't reach"],
      [new StravaError(401, ""), "reconnect"],
    ] as const) {
      const { deps, writes } = setup({ act: err });
      const out = await autoCheck(deps, ATHLETE, "e-new");
      expect(out.status).toBe("founder");
      expect(String(writes[0][0].strava_note)).toContain(words);
      expect(writes[0][0].suggested).toBeNull();
    }
  });

  it("does nothing when Strava isn't connected, the entry isn't waiting, or it's a short link", async () => {
    for (const s of [
      setup({ connected: false }),
      setup({ entries: [verified("e-new", 1490, "2026-11-20T07:00:00Z")] }),
      setup({ entries: [waiting({ strava_activity_id: null })] }),
    ]) {
      expect(await autoCheck(s.deps, ATHLETE, "e-new")).toEqual({ status: "skipped" });
      expect(s.writes).toHaveLength(0);
    }
  });

  it("an older activity recomputes later results in the same write and emails those athletes' corrections", async () => {
    // Later verified entry e2 (Nov 24 10:00) was compared with the 1500 seed. The new activity
    // (Nov 24 07:00, 1450) comes first, so e2 is now compared with 1450.
    const e2: DbEntry = { ...verified("e2", 1480, "2026-11-24T10:00:00Z"), percent: 1.3, beat_limit: true, embers: 20 };
    const { deps, writes } = setup({ entries: [waiting(), e2], act: activity(1450) });
    const out = await autoCheck(deps, ATHLETE, "e-new");
    expect(out.status).toBe("verified");
    const rows = writes[0];
    expect(rows.map((r) => r.id).sort()).toEqual(["e-new", "e2"]);
    expect(rows.find((r) => r.id === "e2")).toMatchObject({ beat_limit: false, embers: 10, email_status: "pending" });
    if (out.status === "verified") expect(out.notices).toEqual([{ entryId: "e2", type: "correction" }]);
  });
});
