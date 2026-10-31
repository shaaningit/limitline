// Works out what to write when the founder verifies, corrects or rejects an entry.
// Pure: given one athlete's entries and seeds plus the change, it returns the rows for
// founder_update_entries (applied all-or-nothing) and which emails to send.

import type { QuestId, RejectReason } from "@/lib/rules/config";
import { evaluate, evaluateAll, type Evaluation, type Seed, type VerifiedEntry } from "@/lib/rules";

export interface DbEntry {
  id: string;
  quest_id: QuestId;
  status: "waiting" | "verified" | "rejected";
  strava_activity_id: string | null;
  activity_at: string | null;
  value: number | null;
  percent: number | null;
  beat_limit: boolean | null;
  embers: number | null;
}

export type Change =
  | { kind: "verify"; id: string; questId: QuestId; stravaActivityId: string; activityAt: Date; value: number }
  | { kind: "reject"; id: string; reason: RejectReason };

export interface Notice {
  entryId: string;
  type: "result" | "correction";
}

export interface Plan {
  rows: Record<string, unknown>[];
  notices: Notice[];
  preview: Evaluation | null; // the changed entry's result, for the admin preview (verify only)
}

function toVerified(e: DbEntry): VerifiedEntry {
  return { id: e.id, questId: e.quest_id, value: Number(e.value), activityAt: new Date(e.activity_at!) };
}

export function planChange(entries: DbEntry[], seeds: Seed[], change: Change, now: Date): Plan {
  const target = entries.find((e) => e.id === change.id);
  if (!target) throw new Error("entry not found");
  const wasVerified = target.status === "verified";

  // The athlete's verified history after the change.
  const verified = entries.filter((e) => e.status === "verified" && e.id !== change.id).map(toVerified);
  if (change.kind === "verify") {
    verified.push({ id: change.id, questId: change.questId, value: change.value, activityAt: change.activityAt });
  }
  const results = evaluateAll(verified, seeds);

  const rows: Record<string, unknown>[] = [];
  const notices: Notice[] = [];

  if (change.kind === "verify") {
    const r = results.get(change.id)!;
    rows.push({
      id: change.id,
      status: "verified",
      quest_id: change.questId,
      strava_activity_id: change.stravaActivityId,
      activity_at: change.activityAt.toISOString(),
      value: change.value,
      percent: r.percent,
      beat_limit: r.beatLimit,
      embers: r.embers,
      reject_reason: null,
      verified_at: now.toISOString(),
      email_status: "pending",
    });
    notices.push({ entryId: change.id, type: wasVerified ? "correction" : "result" });
  } else {
    rows.push({
      id: change.id,
      status: "rejected",
      reject_reason: change.reason,
      percent: null,
      beat_limit: null,
      embers: null,
      email_status: wasVerified ? "pending" : null,
    });
    if (wasVerified) notices.push({ entryId: change.id, type: "correction" });
  }

  // Later results whose limit, % or embers moved because of this change (corrections recompute).
  for (const e of entries) {
    if (e.id === change.id || e.status !== "verified") continue;
    const r = results.get(e.id)!;
    const changed =
      Number(e.percent) !== Number(r.percent) || Boolean(e.beat_limit) !== r.beatLimit || Number(e.embers) !== r.embers;
    if (!changed) continue;
    rows.push({ id: e.id, percent: r.percent, beat_limit: r.beatLimit, embers: r.embers, email_status: "pending" });
    if (Number(e.embers) !== r.embers) notices.push({ entryId: e.id, type: "correction" });
  }

  const preview =
    change.kind === "verify"
      ? evaluate(
          { id: change.id, questId: change.questId, value: change.value, activityAt: change.activityAt },
          seeds.find((s) => s.questId === change.questId),
          verified,
        )
      : null;

  return { rows, notices, preview };
}
