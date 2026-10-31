"use server";

import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/data/session";

// Result card stays at the top of My quests until the athlete has seen it (5A).
export async function markSeen(formData: FormData) {
  const { supabase, userId } = await requireAthlete();
  const id = String(formData.get("id") ?? "");
  await supabase.from("entries").update({ seen_at: new Date().toISOString() }).eq("id", id).eq("athlete_id", userId);
  revalidatePath("/quests");
}

// First-run steps 1-2 are ticked by the athlete: the app can't see Strava follows (re-review #5).
export async function tickChecklist(formData: FormData) {
  const { supabase, userId } = await requireAthlete();
  const step = String(formData.get("step") ?? "");
  if (step !== "checklist_followed" && step !== "checklist_visibility") return;
  await supabase.from("profiles").update({ [step]: true }).eq("id", userId);
  revalidatePath("/quests");
}
