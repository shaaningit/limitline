import "server-only";
import { after } from "next/server";
import { correctionEmail, resultEmail, sendEmail, type ResultFacts } from "@/lib/email";
import type { Evaluation, Seed } from "@/lib/rules";
import type { QuestId, RejectReason } from "@/lib/rules/config";
import { planChange, type Change, type DbEntry } from "./plan";
import type { requireFounder } from "./session";

type Session = Awaited<ReturnType<typeof requireFounder>>;
type Supabase = Session["supabase"];

const ENTRY_COLUMNS =
  "id, athlete_id, quest_id, link, status, reject_reason, strava_activity_id, activity_at, value, percent, beat_limit, embers, submitted_at, email_status";

export interface AdminEntry extends DbEntry {
  athlete_id: string;
  link: string;
  reject_reason: RejectReason | null;
  submitted_at: string;
  email_status: "pending" | "sent" | "failed" | null;
  profiles?: { display_name: string; signed_up_at: string } | null;
}

export async function getQueue(supabase: Supabase) {
  const { data, error } = await supabase
    .from("entries")
    .select(`${ENTRY_COLUMNS}, profiles(display_name, signed_up_at)`)
    .eq("status", "waiting")
    .order("submitted_at", { ascending: true }); // oldest first (14A)
  if (error) throw new Error("Couldn't load the queue");
  return (data ?? []) as unknown as AdminEntry[];
}

export async function getFailedEmails(supabase: Supabase) {
  const { data } = await supabase
    .from("entries")
    .select(`${ENTRY_COLUMNS}, profiles(display_name, signed_up_at)`)
    .eq("email_status", "failed")
    .order("verified_at", { ascending: true });
  return (data ?? []) as unknown as AdminEntry[];
}

export async function getEntry(supabase: Supabase, id: string) {
  const { data } = await supabase
    .from("entries")
    .select(`${ENTRY_COLUMNS}, profiles(display_name, signed_up_at)`)
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as unknown as AdminEntry | null;
}

export async function getHistory(supabase: Supabase, athleteId: string) {
  const [entriesRes, seedsRes] = await Promise.all([
    supabase.from("entries").select(ENTRY_COLUMNS).eq("athlete_id", athleteId),
    supabase.from("seed_limits").select("quest_id, value, effort_count").eq("athlete_id", athleteId),
  ]);
  if (entriesRes.error || seedsRes.error) throw new Error("Couldn't load the athlete's history");
  const seeds: Seed[] = (seedsRes.data ?? []).map((s) => ({
    questId: s.quest_id as QuestId,
    value: Number(s.value),
    effortCount: s.effort_count,
  }));
  return { entries: (entriesRes.data ?? []) as unknown as AdminEntry[], seeds };
}

export type ApplyResult =
  | { status: "saved" }
  | { status: "needs_confirm"; preview: Evaluation }
  | { status: "error"; message: string };

// Verify, correct or reject one entry. Writes all affected results in one transaction,
// then sends result/correction emails after the response (a failed email never undoes a save).
export async function applyChange(session: Session, athleteId: string, change: Change, confirmed: boolean): Promise<ApplyResult> {
  const { supabase } = session;
  const { entries, seeds } = await getHistory(supabase, athleteId);
  const plan = planChange(entries, seeds, change, new Date());

  if (plan.preview?.needsConfirm && !confirmed) return { status: "needs_confirm", preview: plan.preview };

  const { error } = await supabase.rpc("founder_update_entries", { p_rows: plan.rows });
  if (error?.code === "23505") return { status: "error", message: "That Strava activity is already counted" };
  if (error) return { status: "error", message: "Couldn't save, nothing was changed" };

  const embersBefore = new Map(entries.map((e) => [e.id, e.embers === null ? null : Number(e.embers)]));
  after(() => sendNotices(supabase, plan.notices, embersBefore));
  return { status: "saved" };
}

async function sendNotices(
  supabase: Supabase,
  notices: { entryId: string; type: "result" | "correction" }[],
  embersBefore: Map<string, number | null>,
) {
  for (const notice of notices) {
    const ok = await sendOne(supabase, notice.entryId, notice.type, embersBefore.get(notice.entryId) ?? null);
    await supabase.rpc("founder_update_entries", { p_rows: [{ id: notice.entryId, email_status: ok ? "sent" : "failed" }] });
  }
}

async function sendOne(supabase: Supabase, entryId: string, type: "result" | "correction", embersBefore: number | null) {
  const { data } = await supabase
    .from("entries")
    .select("quest_id, status, value, percent, beat_limit, embers, reject_reason, profiles(email)")
    .eq("id", entryId)
    .maybeSingle();
  const row = data as unknown as {
    quest_id: QuestId;
    status: "verified" | "rejected";
    value: number | null;
    percent: number | null;
    beat_limit: boolean | null;
    embers: number | null;
    reject_reason: RejectReason | null;
    profiles: { email: string | null } | null;
  } | null;
  const to = row?.profiles?.email;
  if (!row || !to) return false;
  const facts: ResultFacts = {
    questId: row.quest_id,
    status: row.status,
    value: row.value === null ? null : Number(row.value),
    percent: row.percent === null ? null : Number(row.percent),
    beatLimit: row.beat_limit,
    embers: row.embers,
    rejectReason: row.reject_reason,
  };
  return sendEmail(type === "result" ? resultEmail(to, facts) : correctionEmail(to, facts, embersBefore));
}

// Admin "email not sent, retry" (re-review #3).
export async function retryEmail(session: Session, entryId: string) {
  const entry = await getEntry(session.supabase, entryId);
  if (!entry) return;
  const ok = await sendOne(session.supabase, entryId, entry.status === "verified" ? "result" : "correction", null);
  await session.supabase.rpc("founder_update_entries", { p_rows: [{ id: entryId, email_status: ok ? "sent" : "failed" }] });
}
