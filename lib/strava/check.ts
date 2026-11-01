// The automatic check: reads one Strava activity the way the founder would and decides.
// Pure functions (no network, no clock), so every rule is tested in check.test.ts.
// Rules match questRules() in lib/rules: longer counts at the quest distance, shorter is
// rejected; outdoor runs and rides, pool swims; recorded after sign-up; the athlete's own.

import { formatValue } from "@/lib/format";
import { QUESTS, type QuestId, type RejectReason } from "@/lib/rules/config";

// The parts of Strava's DetailedActivity this check reads.
export interface StravaActivity {
  id: number;
  athlete: { id: number };
  sport_type: string;
  start_date: string; // ISO, UTC
  distance: number; // metres
  elapsed_time: number; // seconds
  moving_time: number; // seconds
  trainer?: boolean;
  manual?: boolean;
  device_watts?: boolean;
  start_latlng?: number[] | null;
  best_efforts?: { name: string; elapsed_time: number; distance: number }[] | null;
}

export interface StravaLap {
  distance: number;
  elapsed_time: number;
}

export interface WattsStream {
  time: number[]; // seconds since the start
  watts: number[];
}

export interface CheckContext {
  stravaAthleteId: number; // the connected account
  signedUpAt: Date;
  watts?: WattsStream | null; // bike quest only
  laps?: StravaLap[] | null; // swims longer than the quest only
}

export type CheckResult =
  | { kind: "value"; value: number; activityAt: Date; note: string }
  | { kind: "reject"; reason: RejectReason; note: string }
  | { kind: "founder"; note: string; value?: number; activityAt?: Date };

const RUN_TYPES = ["Run", "TrailRun"];
const BIKE_TYPES = ["Ride", "MountainBikeRide", "GravelRide"];
const INDOOR_TYPES: Record<string, string> = { VirtualRun: "run", VirtualRide: "bike" };
const E_BIKE_TYPES = ["EBikeRide", "EMountainBikeRide"];

// Results faster or stronger than this are almost certainly not a human on foot / in a pool /
// on a bike, so the founder looks (world records are just outside these).
export const PLAUSIBLE = {
  run5k: 12 * 60 + 30, // fastest believable seconds
  run10k: 26 * 60,
  swim400: 3 * 60 + 40,
  swim1500: 14 * 60 + 30,
  bike20: 500, // highest believable watts for 20 minutes
} satisfies Record<QuestId, number>;

// Strava's own best-effort names for the run quest distances.
const BEST_EFFORT_NAME: Record<number, string> = { 5000: "5k", 10000: "10k" };

// Whether the check needs more than the activity itself, so the caller only fetches what's used.
export function extraDataNeeded(questId: QuestId, activity: StravaActivity): "watts" | "laps" | null {
  const quest = QUESTS[questId];
  if (quest.sport === "bike") return activity.device_watts ? "watts" : null;
  if (quest.sport === "swim" && activity.distance > (quest.distanceMeters ?? 0) + 1) return "laps";
  return null;
}

export function checkActivity(questId: QuestId, a: StravaActivity, ctx: CheckContext): CheckResult {
  const quest = QUESTS[questId];
  const activityAt = new Date(a.start_date);

  if (a.athlete.id !== ctx.stravaAthleteId) return { kind: "reject", reason: "not_own", note: "Recorded by a different Strava account" };
  if (a.manual) return { kind: "reject", reason: "manual_entry", note: "Typed in on Strava, not recorded" };

  // Sport and outdoor rules.
  if (INDOOR_TYPES[a.sport_type] === quest.sport) {
    return { kind: "reject", reason: "not_outdoor", note: `Strava activity type ${a.sport_type}` };
  }
  const sportOk =
    quest.sport === "run" ? RUN_TYPES.includes(a.sport_type) : quest.sport === "bike" ? BIKE_TYPES.includes(a.sport_type) : a.sport_type === "Swim";
  if (!sportOk) {
    const why = E_BIKE_TYPES.includes(a.sport_type) ? "E-bike rides don't count" : `Strava activity type ${a.sport_type}`;
    return { kind: "reject", reason: "wrong_sport", note: why };
  }
  if (quest.sport !== "swim" && a.trainer) return { kind: "reject", reason: "not_outdoor", note: "Marked as indoor on Strava" };
  if (quest.sport === "swim" && a.start_latlng && a.start_latlng.length === 2) {
    return { kind: "founder", note: "Has GPS, so it may be an open-water swim; quests are pool swims" };
  }

  if (activityAt.getTime() < ctx.signedUpAt.getTime()) {
    return { kind: "reject", reason: "before_signup", note: `Recorded ${a.start_date.slice(0, 10)}, before sign-up` };
  }

  const measured =
    quest.sport === "run" ? measureRun(questId, a) : quest.sport === "bike" ? measureBike(a, ctx.watts) : measureSwim(questId, a, ctx.laps);
  if (measured.kind !== "value") return measured;

  const limit = PLAUSIBLE[questId];
  const implausible = quest.measure === "time" ? measured.value < limit : measured.value > limit;
  if (implausible) {
    return {
      kind: "founder",
      note: `${measured.note}: beyond what's humanly likely, please look`,
      value: measured.value,
      activityAt,
    };
  }
  return { kind: "value", value: measured.value, activityAt, note: measured.note };
}

type Measure = { kind: "value"; value: number; note: string } | Exclude<CheckResult, { kind: "value" }>;

function measureRun(questId: QuestId, a: StravaActivity): Measure {
  const meters = QUESTS[questId].distanceMeters!;
  const label = `${meters / 1000} km`;
  if (a.distance < meters) {
    return { kind: "reject", reason: "not_completed", note: `${(a.distance / 1000).toFixed(2)} km, short of ${label}` };
  }
  const effort = (a.best_efforts ?? []).find((e) => e.name === BEST_EFFORT_NAME[meters]);
  if (!effort) return { kind: "founder", note: `Strava has no ${label} best effort for this run (no GPS?)` };
  return {
    kind: "value",
    value: effort.elapsed_time,
    note: `Fastest ${label} on Strava: ${formatValue(questId, effort.elapsed_time)}`,
  };
}

function measureBike(a: StravaActivity, watts: WattsStream | null | undefined): Measure {
  const seconds = QUESTS.bike20.durationSeconds!;
  if (a.elapsed_time < seconds) {
    return { kind: "reject", reason: "not_completed", note: `${Math.floor(a.elapsed_time / 60)} min, short of 20 min` };
  }
  if (!a.device_watts) return { kind: "reject", reason: "needs_power", note: "No power meter on this ride" };
  if (!watts) return { kind: "founder", note: "Couldn't read the power data from Strava" };
  const best = bestAveragePower(watts, seconds);
  if (best === null) return { kind: "reject", reason: "not_completed", note: "Less than 20 minutes of power data" };
  return { kind: "value", value: best, note: `Best 20-min power from Strava data: ${best} W` };
}

function measureSwim(questId: QuestId, a: StravaActivity, laps: StravaLap[] | null | undefined): Measure {
  const meters = QUESTS[questId].distanceMeters!;
  if (a.distance < meters - 1) {
    return { kind: "reject", reason: "not_completed", note: `${Math.round(a.distance)} m, short of ${meters} m` };
  }
  // Exactly the quest distance: the whole swim, rests included.
  if (Math.abs(a.distance - meters) <= 1) {
    return { kind: "value", value: a.elapsed_time, note: `${meters} m swim: ${formatValue(questId, a.elapsed_time)}` };
  }
  const fastest = laps ? fastestLapWindow(laps, meters) : null;
  if (fastest === null) {
    return { kind: "founder", note: `${Math.round(a.distance)} m swim; its laps don't add up to exactly ${meters} m` };
  }
  return { kind: "value", value: fastest, note: `Fastest ${meters} m from laps: ${formatValue(questId, fastest)}` };
}

// Best average watts over any `window` seconds, rounded down. Each sample holds until the next
// one; gaps longer than 5 s (auto-pause, stops) count as 0 W, so stopping never helps.
// null when the data covers less than the window.
export function bestAveragePower(stream: WattsStream, window: number): number | null {
  const { time, watts } = stream;
  const n = Math.min(time.length, watts.length);
  if (n === 0) return null;
  const total = time[n - 1] - time[0] + 1;
  if (total < window) return null;

  const perSecond = new Float64Array(total);
  for (let i = 0; i < n; i++) {
    const start = time[i] - time[0];
    const next = i + 1 < n ? time[i + 1] - time[0] : start + 1;
    const w = Number.isFinite(watts[i]) && watts[i] > 0 ? watts[i] : 0;
    const hold = next - start <= 5 ? next - start : 1;
    for (let s = start; s < start + hold && s < total; s++) perSecond[s] = w;
  }

  let sum = 0;
  for (let s = 0; s < window; s++) sum += perSecond[s];
  let best = sum;
  for (let s = window; s < total; s++) {
    sum += perSecond[s] - perSecond[s - window];
    if (sum > best) best = sum;
  }
  return Math.floor(best / window);
}

// Fastest run of consecutive laps that adds up to exactly `meters` (±1 m), in seconds.
// Rest laps (0 m) inside the run count with their time, so resting never helps.
export function fastestLapWindow(laps: StravaLap[], meters: number): number | null {
  let best: number | null = null;
  for (let i = 0; i < laps.length; i++) {
    let distance = 0;
    let seconds = 0;
    for (let j = i; j < laps.length; j++) {
      distance += laps[j].distance;
      seconds += laps[j].elapsed_time;
      if (Math.abs(distance - meters) <= 1 && laps[i].distance > 0) {
        if (best === null || seconds < best) best = seconds;
        break;
      }
      if (distance > meters + 1) break;
    }
  }
  return best;
}
