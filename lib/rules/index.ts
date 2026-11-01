// LIMITLINE fairness rules. Pure functions: no database, no network, no clock.
// The server calls these and saves the results (D9: the server decides).

import {
  CONFIRM_ABOVE_PERCENT,
  EMBERS,
  INPUT_LIMITS,
  QUESTS,
  type QuestId,
  type Sport,
} from "./config";

// ---------- Strava links (D13) ----------

export type ParsedLink =
  | { kind: "activity"; activityId: string }
  | { kind: "short"; url: string } // strava.app.link: the founder opens it to find the activity ID
  | { kind: "invalid" };

export function parseStravaLink(input: string): ParsedLink {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { kind: "invalid" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "invalid" };

  const host = url.hostname.toLowerCase();
  if (host === "strava.app.link") {
    return url.pathname.length > 1 ? { kind: "short", url: url.toString() } : { kind: "invalid" };
  }
  if (host !== "strava.com" && host !== "www.strava.com") return { kind: "invalid" };

  const match = url.pathname.match(/^\/activities\/(\d+)\/?$/);
  return match ? { kind: "activity", activityId: match[1] } : { kind: "invalid" };
}

// ---------- Admin input (14A, eng re-review #8) ----------

export type InputResult = { ok: true; value: number } | { ok: false; error: string };

export function parseDuration(h: number, m: number, s: number): InputResult {
  const parts = [h, m, s];
  if (parts.some((n) => !Number.isInteger(n) || n < 0)) {
    return { ok: false, error: "Use whole numbers only" };
  }
  if (m > 59 || s > 59) return { ok: false, error: "Minutes and seconds must be 0-59" };
  if (h > INPUT_LIMITS.maxHours) return { ok: false, error: `Hours must be ${INPUT_LIMITS.maxHours} or less` };
  const total = h * 3600 + m * 60 + s;
  if (total === 0) return { ok: false, error: "Time can't be zero" };
  return { ok: true, value: total };
}

export function parseWatts(w: number): InputResult {
  if (!Number.isInteger(w)) return { ok: false, error: "Use a whole number of watts" };
  if (w < INPUT_LIMITS.minWatts || w > INPUT_LIMITS.maxWatts) {
    return { ok: false, error: `Watts must be ${INPUT_LIMITS.minWatts}-${INPUT_LIMITS.maxWatts}` };
  }
  return { ok: true, value: w };
}

// ---------- Limits, % and embers ----------

// A verified result: seconds for time quests, watts for the bike quest.
export interface VerifiedEntry {
  id: string;
  questId: QuestId;
  value: number;
  activityAt: Date;
}

// The founder's pre-pilot reading of one quest type (D21, with an effort count per re-review #7).
export interface Seed {
  questId: QuestId;
  value: number;
  effortCount: number;
}

// True if `a` is a better result than `b` for this quest.
function isBetter(questId: QuestId, a: number, b: number): boolean {
  return QUESTS[questId].measure === "time" ? a < b : a > b;
}

export interface LimitState {
  limit: number | null;
  effortCount: number; // seed efforts + verified entries
  entriesBefore: number; // verified pilot entries only
}

// The limit and effort count as they stood just before `at`.
// Uses the seed plus verified entries recorded strictly earlier (by activity date, re-review #1).
export function limitBefore(
  questId: QuestId,
  seed: Seed | undefined,
  entries: VerifiedEntry[],
  at: Date,
): LimitState {
  let limit = seed && seed.questId === questId ? seed.value : null;
  let effortCount = seed && seed.questId === questId ? seed.effortCount : 0;
  let entriesBefore = 0;
  for (const e of entries) {
    if (e.questId !== questId || e.activityAt.getTime() >= at.getTime()) continue;
    effortCount += 1;
    entriesBefore += 1;
    if (limit === null || isBetter(questId, e.value, limit)) limit = e.value;
  }
  return { limit, effortCount, entriesBefore };
}

// "% beyond limit", always higher = better.
// Time: (limit - result) / limit. Power: (result - limit) / limit.
export function percentBeyond(questId: QuestId, limit: number, result: number): number {
  const raw =
    QUESTS[questId].measure === "time" ? (limit - result) / limit : (result - limit) / limit;
  return Math.round(raw * 1000) / 10; // one decimal place
}

export interface Evaluation {
  limitBefore: number | null;
  percent: number | null; // null when there was no limit to compare against
  beatLimit: boolean;
  doublingUnlocked: boolean;
  embers: number;
  needsConfirm: boolean; // admin double-check (D17)
}

export function evaluate(entry: VerifiedEntry, seed: Seed | undefined, history: VerifiedEntry[]): Evaluation {
  const before = limitBefore(entry.questId, seed, history, entry.activityAt);
  const percent = before.limit === null ? null : percentBeyond(entry.questId, before.limit, entry.value);
  const beatLimit = percent !== null && percent > 0;
  const doublingUnlocked = before.effortCount >= EMBERS.minEffortsToDouble;
  const embers = EMBERS.base * (beatLimit && doublingUnlocked ? EMBERS.beatMultiplier : 1);
  // D17: confirm an athlete's first result for a quest type, or a jump over the threshold.
  const needsConfirm = before.entriesBefore === 0 || (percent !== null && percent > CONFIRM_ABOVE_PERCENT);
  return { limitBefore: before.limit, percent, beatLimit, doublingUnlocked, embers, needsConfirm };
}

// Re-evaluates every entry in activity order. Corrections just change an entry and rerun this,
// so later limits and embers always match the corrected history (eng review Section 2 #1, #4).
export function evaluateAll(
  entries: VerifiedEntry[],
  seeds: Seed[],
): Map<string, Evaluation> {
  const sorted = [...entries].sort((a, b) => a.activityAt.getTime() - b.activityAt.getTime());
  const out = new Map<string, Evaluation>();
  for (const entry of sorted) {
    const seed = seeds.find((s) => s.questId === entry.questId);
    out.set(entry.id, evaluate(entry, seed, sorted));
  }
  return out;
}

// Balance can go below zero after a correction (eng re-review D3); the shop locks until it's positive.
export function embersBalance(earned: number[], spent: number[]): { balance: number; shopLocked: boolean } {
  const balance = earned.reduce((a, b) => a + b, 0) - spent.reduce((a, b) => a + b, 0);
  return { balance, shopLocked: balance < 0 };
}

export function canRedeem(balance: number, price: number): boolean {
  return balance >= 0 && balance >= price;
}

// ---------- Weeks (D16, D20) ----------

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localDateParts(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { year: +get("year"), month: +get("month"), day: +get("day"), weekday: get("weekday") };
}

// The Monday (YYYY-MM-DD, pilot time zone) of the week an activity belongs to.
export function weekStart(at: Date, timeZone: string): string {
  const { year, month, day, weekday } = localDateParts(at, timeZone);
  const daysSinceMonday = WEEKDAYS.indexOf(weekday);
  const monday = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
  return monday.toISOString().slice(0, 10);
}

// Pilot week number (1 = the week containing pilotStart), for the D20 success metric.
export function pilotWeek(at: Date, pilotStart: Date, timeZone: string): number {
  const ms = Date.parse(weekStart(at, timeZone)) - Date.parse(weekStart(pilotStart, timeZone));
  return Math.round(ms / (7 * 24 * 3600 * 1000)) + 1;
}

// "Came back" = at least one valid activity in BOTH week 3 and week 4 (D20).
export function cameBack(activityDates: Date[], pilotStart: Date, timeZone: string): boolean {
  const weeks = new Set(activityDates.map((d) => pilotWeek(d, pilotStart, timeZone)));
  return weeks.has(3) && weeks.has(4);
}

// ---------- Boards (D16, 3A) ----------

export interface BoardInput {
  athleteId: string;
  displayName: string; // "First L."
  questId: QuestId;
  percent: number | null;
  beatLimit: boolean;
  activityAt: Date;
  showOnBoards: boolean;
}

export interface BoardRow {
  rank: number;
  athleteId: string;
  displayName: string;
  questLabel: string;
  percent: number;
}

export interface Board {
  rows: BoardRow[];
  othersCompleted: number; // athletes with a valid activity this week but no pass on this board
}

// Best % beyond own limit per athlete for one sport and week. Raw times/watts never appear (3A).
export function buildBoard(entries: BoardInput[], sport: Sport, week: string, timeZone: string): Board {
  const inWeek = entries.filter(
    (e) => e.showOnBoards && QUESTS[e.questId].sport === sport && weekStart(e.activityAt, timeZone) === week,
  );
  const best = new Map<string, BoardInput>();
  for (const e of inWeek) {
    if (!e.beatLimit || e.percent === null) continue;
    const current = best.get(e.athleteId);
    if (!current || e.percent > current.percent! || (e.percent === current.percent && e.activityAt < current.activityAt)) {
      best.set(e.athleteId, e);
    }
  }
  const ranked = [...best.values()].sort(
    (a, b) => b.percent! - a.percent! || a.activityAt.getTime() - b.activityAt.getTime(),
  );
  const rows = ranked.map((e, i) => ({
    rank: i + 1,
    athleteId: e.athleteId,
    displayName: e.displayName,
    questLabel: QUESTS[e.questId].label,
    percent: e.percent!,
  }));
  const completed = new Set(inWeek.map((e) => e.athleteId));
  return { rows, othersCompleted: [...completed].filter((id) => !best.has(id)).length };
}

// ---------- "How embers work" sheet (8A), built from config so it can't drift ----------

export function embersExplainer(): string[] {
  return [
    `Complete a quest: ${EMBERS.base} embers.`,
    `Beat your own limit: ${EMBERS.base * EMBERS.beatMultiplier} embers (double).`,
    `Doubling starts once you have ${EMBERS.minEffortsToDouble} efforts of a quest type.`,
    "Spend embers in the Shop.",
  ];
}

// What counts for a quest, shown on the quest page and to the founder in admin.
// Longer counts (a 10 km run on the 5 km quest is timed on its fastest 5 km);
// shorter is rejected as "Quest distance or time not completed".
export function questRules(questId: QuestId): { counts: string; timedOn: string; rejected: string } {
  const q = QUESTS[questId];
  if (q.measure === "power") {
    const min = Math.round((q.durationSeconds ?? 0) / 60);
    return {
      counts: `Any outdoor ride of ${min} minutes or more, with a power meter.`,
      timedOn: `We use your best ${min}-minute power from the ride.`,
      rejected: `Shorter than ${min} minutes, or no power data, won't be approved.`,
    };
  }
  const meters = q.distanceMeters ?? 0;
  const distance = q.sport === "swim" ? `${meters} m` : `${meters / 1000} km`; // matches the quest labels
  const activity = q.sport === "run" ? "outdoor run" : "pool swim";
  return {
    counts: `Any ${activity} of ${distance} or longer.`,
    timedOn: `A longer one counts as ${distance}, timed on its fastest ${distance}.`,
    rejected: `Shorter than ${distance} won't be approved.`,
  };
}

export type { QuestId, Sport };
