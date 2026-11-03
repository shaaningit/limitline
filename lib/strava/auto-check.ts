// What happens right after an athlete pastes a link, when their Strava is connected:
// read the activity from Strava, check it (check.ts), then approve, reject, or hand it to
// the founder with the numbers already filled in. Dependencies are passed in so the whole
// flow is tested without Strava or a database (auto-check.test.ts).

import { planChange, type Change, type DbEntry, type Notice } from "@/lib/data/plan";
import { formatPercent } from "@/lib/format";
import type { Seed } from "@/lib/rules";
import { CONFIRM_ABOVE_PERCENT, type RejectReason } from "@/lib/rules/config";
import { StravaError } from "./errors";
import { checkActivity, extraDataNeeded, type DistanceStream, type StravaActivity, type StravaLap, type WattsStream } from "./check";

export interface AutoCheckDeps {
  // The athlete's Strava connection, or null when they haven't connected.
  connection(athleteId: string): Promise<{ stravaAthleteId: number; token(): Promise<string> } | null>;
  load(athleteId: string): Promise<{ entries: DbEntry[]; seeds: Seed[]; signedUpAt: Date }>;
  strava: {
    getActivity(token: string, id: string): Promise<StravaActivity>;
    getWattsStream(token: string, id: string): Promise<WattsStream | null>;
    getLaps(token: string, id: string): Promise<StravaLap[]>;
    getDistanceStream(token: string, id: string): Promise<DistanceStream | null>;
  };
  write(rows: Record<string, unknown>[]): Promise<void>; // all-or-nothing (apply_entry_rows)
  now(): Date;
}

export type AutoCheckOutcome =
  | { status: "skipped" } // not connected, or nothing to check: the founder's queue as before
  | { status: "verified"; note: string; notices: Notice[]; embersBefore: Map<string, number | null> }
  | { status: "rejected"; reason: RejectReason; note: string }
  | { status: "founder"; note: string };

export async function autoCheck(deps: AutoCheckDeps, athleteId: string, entryId: string): Promise<AutoCheckOutcome> {
  const conn = await deps.connection(athleteId);
  if (!conn) return { status: "skipped" };
  const { entries, seeds, signedUpAt } = await deps.load(athleteId);
  const entry = entries.find((e) => e.id === entryId);
  if (!entry || entry.status !== "waiting" || !entry.strava_activity_id) return { status: "skipped" };
  const activityId = entry.strava_activity_id;

  const toFounder = async (note: string, suggestion?: { value: number; activityAt: Date }): Promise<AutoCheckOutcome> => {
    await deps.write([
      {
        id: entryId,
        strava_note: note.slice(0, 300),
        suggested: suggestion
          ? {
              quest_id: entry.quest_id,
              strava_activity_id: activityId,
              activity_at: suggestion.activityAt.toISOString(),
              value: suggestion.value,
            }
          : null,
      },
    ]);
    return { status: "founder", note };
  };

  // 1. Read the activity (and power or laps only when the check needs them).
  let activity: StravaActivity;
  let watts: WattsStream | null = null;
  let laps: StravaLap[] | null = null;
  let distance: DistanceStream | null = null;
  try {
    const token = await conn.token();
    activity = await deps.strava.getActivity(token, activityId);
    const extra = extraDataNeeded(entry.quest_id, activity);
    if (extra === "watts") watts = await deps.strava.getWattsStream(token, activityId).catch(() => null);
    if (extra === "laps") laps = await deps.strava.getLaps(token, activityId).catch(() => null);
    if (extra === "distance") distance = await deps.strava.getDistanceStream(token, activityId).catch(() => null);
  } catch (e) {
    return toFounder(stravaProblem(e));
  }

  // 2. Check it.
  const result = checkActivity(entry.quest_id, activity, { stravaAthleteId: conn.stravaAthleteId, signedUpAt, watts, laps, distance });
  if (result.kind === "founder") {
    return toFounder(result.note, result.value !== undefined ? { value: result.value, activityAt: result.activityAt! } : undefined);
  }

  const now = deps.now();
  if (result.kind === "reject") {
    const plan = planChange(entries, seeds, { kind: "reject", id: entryId, reason: result.reason }, now);
    await deps.write(markStrava(plan.rows, entryId, result.note));
    return { status: "rejected", reason: result.reason, note: result.note };
  }

  // 3. Approve, unless it's a big jump: those keep the founder's double-check (D17).
  const change: Change = { kind: "verify", id: entryId, questId: entry.quest_id, stravaActivityId: activityId, activityAt: result.activityAt, value: result.value };
  const plan = planChange(entries, seeds, change, now);
  const percent = plan.preview?.percent ?? null;
  if (percent !== null && percent > CONFIRM_ABOVE_PERCENT) {
    return toFounder(`${result.note} · ${formatPercent(percent)} beyond the limit, the founder double-checks big jumps`, result);
  }
  await deps.write(markStrava(plan.rows, entryId, result.note));
  return {
    status: "verified",
    note: result.note,
    // The athlete sees their own result on screen right away, so no email for it;
    // other results that moved because of it still get correction emails.
    notices: plan.notices.filter((n) => n.entryId !== entryId),
    embersBefore: new Map(entries.map((e) => [e.id, e.embers === null ? null : Number(e.embers)])),
  };
}

function markStrava(rows: Record<string, unknown>[], entryId: string, note: string) {
  return rows.map((r) =>
    r.id === entryId ? { ...r, checked_by: "strava", strava_note: note.slice(0, 300), suggested: null, email_status: null } : r,
  );
}

function stravaProblem(e: unknown): string {
  if (e instanceof StravaError) {
    if (e.status === 404) return "Strava can't find this activity for the athlete's account (deleted, or set to Only You)";
    if (e.status === 401 || e.status === 400) return "The athlete's Strava connection has expired; they can reconnect in Profile";
    if (e.status === 429) return "Strava is busy right now (rate limit), so this one needs a manual check";
    if (e.status === 0) return "Couldn't reach Strava, so this one needs a manual check";
    return `Strava answered ${e.status}, so this one needs a manual check`;
  }
  return "Something went wrong reading Strava, so this one needs a manual check";
}
