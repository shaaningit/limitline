"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyChange, getEntry, retryEmail } from "@/lib/data/admin";
import { requireFounder } from "@/lib/data/session";
import { formatPercent, formatValue } from "@/lib/format";
import { parseAmount, parseDuration, type Evaluation } from "@/lib/rules";
import { PILOT_TIME_ZONE, QUESTS, QUEST_IDS, REJECT_REASONS, type QuestId, type RejectReason } from "@/lib/rules/config";
import { zonedLocalToUtc } from "@/lib/time";

export interface EntryFormState {
  status: "idle" | "needs_confirm" | "saved" | "error";
  message: string;
  preview?: string;
  // What was submitted, so the form can show it again (React clears forms after an action).
  values?: Record<string, string>;
  // The double-check only confirms the exact values that were previewed (D17).
  confirmToken?: string;
}

const FIELDS = ["quest", "strava_id", "activity_at", "h", "m", "s", "amount"];
const echo = (formData: FormData) => Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));

function readValue(questId: QuestId, formData: FormData) {
  if (QUESTS[questId].measure !== "time") return parseAmount(questId, Number(formData.get("amount")));
  return parseDuration(Number(formData.get("h") || 0), Number(formData.get("m") || 0), Number(formData.get("s") || 0));
}

function describePreview(questId: QuestId, value: number, p: Evaluation): string {
  const limit = p.limitBefore === null ? "no limit yet" : `limit ${formatValue(questId, p.limitBefore)}`;
  const result = p.percent === null ? "sets the first limit" : `${formatPercent(p.percent)} beyond limit`;
  return `${formatValue(questId, value)} vs ${limit}: ${result}, ${p.embers} embers`;
}

export async function saveEntry(_prev: EntryFormState, formData: FormData): Promise<EntryFormState> {
  const session = await requireFounder();
  const entryId = String(formData.get("entry_id") ?? "");
  const entry = await getEntry(session.supabase, entryId);
  if (!entry) return { status: "error", message: "Entry not found" };

  if (formData.get("intent") === "reject") {
    const reason = String(formData.get("reason") ?? "") as RejectReason;
    if (!(reason in REJECT_REASONS)) return { status: "error", message: "Pick a reason" };
    const res = await applyChange(session, entry.athlete_id, { kind: "reject", id: entryId, reason }, true);
    revalidatePath("/admin", "layout");
    return res.status === "saved"
      ? { status: "saved", message: `Rejected: ${REJECT_REASONS[reason]}` }
      : { status: "error", message: res.status === "error" ? res.message : "Couldn't save" };
  }

  const values = echo(formData);
  const fail = (message: string): EntryFormState => ({ status: "error", message, values });

  const questId = values.quest as QuestId;
  if (!QUEST_IDS.includes(questId)) return fail("Pick a quest");

  const stravaId = values.strava_id.trim();
  if (!/^\d{1,20}$/.test(stravaId)) return fail("Enter the Strava activity number from the link");

  const activityAt = zonedLocalToUtc(values.activity_at, PILOT_TIME_ZONE);
  if (!activityAt) return fail("Enter the activity date and time");
  if (activityAt > new Date()) return fail("The activity date is in the future");
  const signedUp = entry.profiles?.signed_up_at ? new Date(entry.profiles.signed_up_at) : null;
  if (signedUp && activityAt < signedUp) {
    return fail('This activity is from before the athlete signed up. Reject it with "Before your sign-up".');
  }

  const value = readValue(questId, formData);
  if (!value.ok) return fail(value.error);

  const token = [entryId, questId, stravaId, activityAt.toISOString(), value.value].join("|");
  const res = await applyChange(
    session,
    entry.athlete_id,
    { kind: "verify", id: entryId, questId, stravaActivityId: stravaId, activityAt, value: value.value },
    formData.get("confirm_token") === token,
  );
  if (res.status === "needs_confirm") {
    return {
      status: "needs_confirm",
      message: "This result is unusual (first result of this quest, or more than 10% beyond the limit). Check it, then confirm.",
      preview: describePreview(questId, value.value, res.preview),
      values,
      confirmToken: token,
    };
  }
  if (res.status === "error") return fail(res.message);
  revalidatePath("/admin", "layout");
  return { status: "saved", message: "Saved. The athlete's email is on its way." };
}

export async function retryEmailAction(formData: FormData) {
  const session = await requireFounder();
  await retryEmail(session, String(formData.get("entry_id") ?? ""));
  revalidatePath("/admin");
}

// ---------- Seed limits (D21, with effort counts) ----------

export async function saveSeed(formData: FormData) {
  const { supabase } = await requireFounder();
  const athleteId = String(formData.get("athlete_id") ?? "");
  const back = (error: string) => redirect(`/admin/athletes?athlete=${athleteId}&error=${encodeURIComponent(error)}`);
  const questId = String(formData.get("quest") ?? "") as QuestId;
  if (!QUEST_IDS.includes(questId)) back("Pick a quest");
  const efforts = Number(formData.get("effort_count"));
  if (!Number.isInteger(efforts) || efforts < 0) back("Efforts seen must be a whole number");
  const value = readValue(questId, formData);
  if (!value.ok) back(value.error);
  const { error } = await supabase
    .from("seed_limits")
    .upsert({ athlete_id: athleteId, quest_id: questId, value: value.ok ? value.value : 0, effort_count: efforts });
  if (error) back("Couldn't save the seed");
  revalidatePath("/admin/athletes");
  redirect(`/admin/athletes?athlete=${athleteId}`);
}

export async function deleteSeed(formData: FormData) {
  const { supabase } = await requireFounder();
  await supabase
    .from("seed_limits")
    .delete()
    .eq("athlete_id", String(formData.get("athlete_id") ?? ""))
    .eq("quest_id", String(formData.get("quest") ?? ""));
  revalidatePath("/admin/athletes");
}

// ---------- Shop (D15) ----------

export async function saveItem(formData: FormData) {
  const { supabase } = await requireFounder();
  const id = String(formData.get("id") ?? "");
  const item = {
    name: String(formData.get("name") ?? "").trim(),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    active: formData.get("active") === "on",
  };
  if (!item.name || !Number.isInteger(item.price) || item.price < 1 || !Number.isInteger(item.stock) || item.stock < 0) {
    redirect(`/admin/shop?error=${encodeURIComponent("Name, a price of 1 or more, and stock of 0 or more are required")}`);
  }
  const { error } = id
    ? await supabase.from("shop_items").update(item).eq("id", id)
    : await supabase.from("shop_items").insert(item);
  if (error) redirect(`/admin/shop?error=${encodeURIComponent("Couldn't save the item")}`);
  revalidatePath("/admin/shop");
  redirect("/admin/shop");
}

export async function setRedemptionStatus(formData: FormData) {
  const { supabase } = await requireFounder();
  const status = String(formData.get("status") ?? "");
  if (status !== "handed_over" && status !== "cancelled") return;
  const id = String(formData.get("id") ?? "");
  const { data: current } = await supabase.from("redemptions").select("status, item_id").eq("id", id).maybeSingle();
  if (!current || current.status !== "requested") return;
  await supabase.from("redemptions").update({ status }).eq("id", id);
  // A cancelled request refunds the embers (balance excludes cancelled) and returns the item to stock.
  if (status === "cancelled") {
    const { data: item } = await supabase.from("shop_items").select("stock").eq("id", current.item_id).maybeSingle();
    if (item) await supabase.from("shop_items").update({ stock: item.stock + 1 }).eq("id", current.item_id);
  }
  revalidatePath("/admin/shop");
}
