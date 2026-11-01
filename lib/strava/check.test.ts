import { describe, expect, it } from "vitest";
import {
  bestAveragePower,
  checkActivity,
  extraDataNeeded,
  fastestLapWindow,
  type CheckContext,
  type StravaActivity,
} from "./check";

const ME = 9001;
const ctx: CheckContext = { stravaAthleteId: ME, signedUpAt: new Date("2026-11-01T00:00:00Z") };

// A 10.2 km outdoor run with Strava's best efforts, as the API returns it (trimmed).
function run(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 111,
    athlete: { id: ME },
    sport_type: "Run",
    start_date: "2026-11-20T07:00:00Z",
    distance: 10210.4,
    elapsed_time: 3100,
    moving_time: 3050,
    trainer: false,
    manual: false,
    start_latlng: [51.5, -0.12],
    best_efforts: [
      { name: "1k", elapsed_time: 280, distance: 1000 },
      { name: "5k", elapsed_time: 1498, distance: 5000 },
      { name: "10k", elapsed_time: 3040, distance: 10000 },
    ],
    ...overrides,
  };
}

describe("runs: longer counts at the quest distance, shorter is rejected", () => {
  it("a 10 km run on the 5 km quest is timed on its fastest 5 km", () => {
    const r = checkActivity("run5k", run(), ctx);
    expect(r).toMatchObject({ kind: "value", value: 1498 });
    if (r.kind === "value") {
      expect(r.activityAt.toISOString()).toBe("2026-11-20T07:00:00.000Z");
      expect(r.note).toContain("24:58");
    }
  });
  it("the same run on the 10 km quest uses its 10 km best effort", () => {
    expect(checkActivity("run10k", run(), ctx)).toMatchObject({ kind: "value", value: 3040 });
  });
  it("a 5 km run on the 10 km quest is rejected as not completed", () => {
    const r = checkActivity("run10k", run({ distance: 5020, best_efforts: [{ name: "5k", elapsed_time: 1500, distance: 5000 }] }), ctx);
    expect(r).toMatchObject({ kind: "reject", reason: "not_completed" });
    if (r.kind === "reject") expect(r.note).toBe("5.02 km, short of 10 km");
  });
  it("4.99 km is short of 5 km: no rounding up", () => {
    expect(checkActivity("run5k", run({ distance: 4990 }), ctx)).toMatchObject({ kind: "reject", reason: "not_completed" });
  });
  it("a long enough run with no best effort (no GPS) goes to the founder", () => {
    expect(checkActivity("run5k", run({ best_efforts: [] }), ctx).kind).toBe("founder");
    expect(checkActivity("run5k", run({ best_efforts: undefined }), ctx).kind).toBe("founder");
  });
  it("trail runs count", () => {
    expect(checkActivity("run5k", run({ sport_type: "TrailRun" }), ctx).kind).toBe("value");
  });
});

describe("who, when and how it was recorded", () => {
  it("someone else's activity is rejected", () => {
    expect(checkActivity("run5k", run({ athlete: { id: 42 } }), ctx)).toMatchObject({ kind: "reject", reason: "not_own" });
  });
  it("an activity from before sign-up is rejected", () => {
    expect(checkActivity("run5k", run({ start_date: "2026-10-31T23:59:59Z" }), ctx)).toMatchObject({
      kind: "reject",
      reason: "before_signup",
    });
  });
  it("an activity typed in by hand is rejected", () => {
    expect(checkActivity("run5k", run({ manual: true }), ctx)).toMatchObject({ kind: "reject", reason: "manual_entry" });
  });
  it("treadmill and virtual runs are rejected as not outdoor", () => {
    expect(checkActivity("run5k", run({ trainer: true }), ctx)).toMatchObject({ kind: "reject", reason: "not_outdoor" });
    expect(checkActivity("run5k", run({ sport_type: "VirtualRun" }), ctx)).toMatchObject({ kind: "reject", reason: "not_outdoor" });
  });
  it("the wrong sport is rejected", () => {
    expect(checkActivity("run5k", run({ sport_type: "Ride" }), ctx)).toMatchObject({ kind: "reject", reason: "wrong_sport" });
    expect(checkActivity("run5k", run({ sport_type: "Walk" }), ctx)).toMatchObject({ kind: "reject", reason: "wrong_sport" });
    expect(checkActivity("swim400", run(), ctx)).toMatchObject({ kind: "reject", reason: "wrong_sport" });
  });
  it("an impossibly fast run goes to the founder with its numbers", () => {
    const r = checkActivity("run5k", run({ best_efforts: [{ name: "5k", elapsed_time: 700, distance: 5000 }] }), ctx);
    expect(r).toMatchObject({ kind: "founder", value: 700 });
  });
});

// A 45-minute ride with a power meter.
function ride(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 222,
    athlete: { id: ME },
    sport_type: "Ride",
    start_date: "2026-11-21T08:00:00Z",
    distance: 24000,
    elapsed_time: 2700,
    moving_time: 2650,
    trainer: false,
    manual: false,
    device_watts: true,
    start_latlng: [51.5, -0.12],
    ...overrides,
  };
}

function steadyWatts(seconds: number, w: number, every = 1) {
  const time: number[] = [];
  const watts: number[] = [];
  for (let t = 0; t < seconds; t += every) {
    time.push(t);
    watts.push(w);
  }
  return { time, watts };
}

describe("bike 20-min power", () => {
  it("uses the best 20 minutes of the power stream", () => {
    // 10 min at 200 W, 20 min at 260 W, 15 min at 180 W.
    const a = steadyWatts(600, 200);
    const b = steadyWatts(1200, 260);
    const c = steadyWatts(900, 180);
    const watts = {
      time: [...a.time, ...b.time.map((t) => t + 600), ...c.time.map((t) => t + 1800)],
      watts: [...a.watts, ...b.watts, ...c.watts],
    };
    expect(checkActivity("bike20", ride(), { ...ctx, watts })).toMatchObject({ kind: "value", value: 260 });
  });
  it("a ride without a power meter is rejected", () => {
    expect(checkActivity("bike20", ride({ device_watts: false }), ctx)).toMatchObject({ kind: "reject", reason: "needs_power" });
  });
  it("a ride shorter than 20 minutes is rejected", () => {
    expect(checkActivity("bike20", ride({ elapsed_time: 1199 }), ctx)).toMatchObject({ kind: "reject", reason: "not_completed" });
  });
  it("indoor trainer and e-bike rides are rejected", () => {
    expect(checkActivity("bike20", ride({ trainer: true }), ctx)).toMatchObject({ reason: "not_outdoor" });
    expect(checkActivity("bike20", ride({ sport_type: "VirtualRide" }), ctx)).toMatchObject({ reason: "not_outdoor" });
    expect(checkActivity("bike20", ride({ sport_type: "EBikeRide" }), ctx)).toMatchObject({ reason: "wrong_sport" });
  });
  it("gravel and mountain bike rides count", () => {
    const watts = steadyWatts(1500, 220);
    expect(checkActivity("bike20", ride({ sport_type: "GravelRide" }), { ...ctx, watts }).kind).toBe("value");
    expect(checkActivity("bike20", ride({ sport_type: "MountainBikeRide" }), { ...ctx, watts }).kind).toBe("value");
  });
  it("power data that couldn't be read goes to the founder", () => {
    expect(checkActivity("bike20", ride(), { ...ctx, watts: null }).kind).toBe("founder");
  });
  it("over 500 W for 20 minutes goes to the founder", () => {
    expect(checkActivity("bike20", ride(), { ...ctx, watts: steadyWatts(1300, 520) })).toMatchObject({ kind: "founder", value: 520 });
  });
});

describe("bestAveragePower", () => {
  it("averages a steady effort exactly", () => {
    expect(bestAveragePower(steadyWatts(1200, 250), 1200)).toBe(250);
  });
  it("holds a sample until the next one (smart recording every 2 s)", () => {
    expect(bestAveragePower(steadyWatts(1300, 240, 2), 1200)).toBe(240);
  });
  it("counts a long stop as 0 W, so pausing never helps", () => {
    // 10 min at 300 W, a 10-minute stop (no samples), 10 min at 300 W.
    const first = steadyWatts(600, 300);
    const second = steadyWatts(600, 300);
    const stream = { time: [...first.time, ...second.time.map((t) => t + 1200)], watts: [...first.watts, ...second.watts] };
    expect(bestAveragePower(stream, 1200)).toBe(150);
  });
  it("is null with less data than the window", () => {
    expect(bestAveragePower(steadyWatts(1199, 300), 1200)).toBeNull();
    expect(bestAveragePower({ time: [], watts: [] }, 1200)).toBeNull();
  });
  it("treats missing or negative readings as 0 W", () => {
    const s = steadyWatts(1200, 200);
    s.watts[0] = NaN;
    s.watts[1] = -50;
    expect(bestAveragePower(s, 1200)).toBe(199);
  });
});

// A pool swim (no GPS).
function swim(overrides: Partial<StravaActivity> = {}): StravaActivity {
  return {
    id: 333,
    athlete: { id: ME },
    sport_type: "Swim",
    start_date: "2026-11-22T06:30:00Z",
    distance: 400,
    elapsed_time: 412,
    moving_time: 400,
    trainer: false,
    manual: false,
    start_latlng: [],
    ...overrides,
  };
}

describe("pool swims", () => {
  it("exactly the quest distance uses the whole swim's elapsed time", () => {
    expect(checkActivity("swim400", swim(), ctx)).toMatchObject({ kind: "value", value: 412 });
  });
  it("a longer swim uses its fastest consecutive laps that add up to the quest distance", () => {
    const laps = [
      { distance: 200, elapsed_time: 220 },
      { distance: 0, elapsed_time: 60 }, // rest
      { distance: 100, elapsed_time: 98 },
      { distance: 100, elapsed_time: 97 },
      { distance: 100, elapsed_time: 99 },
      { distance: 100, elapsed_time: 101 },
      { distance: 200, elapsed_time: 230 },
    ];
    const a = swim({ distance: 800, elapsed_time: 905 });
    expect(extraDataNeeded("swim400", a)).toBe("laps");
    expect(checkActivity("swim400", a, { ...ctx, laps })).toMatchObject({ kind: "value", value: 395 });
  });
  it("a longer swim whose laps don't add up goes to the founder", () => {
    const laps = [{ distance: 750, elapsed_time: 800 }, { distance: 750, elapsed_time: 810 }];
    expect(checkActivity("swim400", swim({ distance: 1500 }), { ...ctx, laps }).kind).toBe("founder");
    expect(checkActivity("swim400", swim({ distance: 1500 }), { ...ctx, laps: null }).kind).toBe("founder");
  });
  it("a shorter swim is rejected", () => {
    expect(checkActivity("swim1500", swim({ distance: 1450 }), ctx)).toMatchObject({ kind: "reject", reason: "not_completed" });
  });
  it("a swim with GPS (open water?) goes to the founder", () => {
    expect(checkActivity("swim400", swim({ start_latlng: [51.5, -0.12] }), ctx).kind).toBe("founder");
  });
});

describe("fastestLapWindow", () => {
  it("never lets a rest lap start or shorten the window", () => {
    const laps = [
      { distance: 0, elapsed_time: 5 },
      { distance: 400, elapsed_time: 400 },
      { distance: 0, elapsed_time: 30 },
    ];
    expect(fastestLapWindow(laps, 400)).toBe(400);
  });
  it("includes rests inside the window", () => {
    const laps = [
      { distance: 200, elapsed_time: 200 },
      { distance: 0, elapsed_time: 60 },
      { distance: 200, elapsed_time: 200 },
    ];
    expect(fastestLapWindow(laps, 400)).toBe(460);
  });
  it("is null when no consecutive laps add up exactly", () => {
    expect(fastestLapWindow([{ distance: 300, elapsed_time: 300 }, { distance: 300, elapsed_time: 300 }], 400)).toBeNull();
  });
});

describe("extraDataNeeded", () => {
  it("fetches only what the check uses", () => {
    expect(extraDataNeeded("run5k", run())).toBeNull();
    expect(extraDataNeeded("bike20", ride())).toBe("watts");
    expect(extraDataNeeded("bike20", ride({ device_watts: false }))).toBeNull();
    expect(extraDataNeeded("swim400", swim())).toBeNull();
  });
});
