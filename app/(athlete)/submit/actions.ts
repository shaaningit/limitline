"use server";

import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";
import { parseStravaLink } from "@/lib/rules";
import { QUEST_IDS, type QuestId } from "@/lib/rules/config";

export interface SubmitState {
  message: string;
  link: string; // keep what they typed on errors (4A)
  quest?: string;
}

export async function submitEntry(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const { supabase, userId } = await requireAthlete();
  const link = String(formData.get("link") ?? "").trim();
  const quest = String(formData.get("quest") ?? "") as QuestId;

  const parsed = parseStravaLink(link);
  if (parsed.kind === "invalid") return { message: "That's not a Strava activity link", link, quest };
  if (!QUEST_IDS.includes(quest)) return { message: "Pick which quest this activity is for", link };

  const stravaId = parsed.kind === "activity" ? parsed.activityId : null;
  const { error } = await supabase.from("entries").insert({
    athlete_id: userId,
    quest_id: quest,
    link: parsed.kind === "activity" ? link : parsed.url,
    strava_activity_id: stravaId,
  });

  if (error?.code === "23505") {
    // Unique Strava activity: tell them when, if it was theirs.
    const { data: mine } = await supabase
      .from("entries")
      .select("submitted_at")
      .eq("athlete_id", userId)
      .eq("strava_activity_id", stravaId!)
      .maybeSingle();
    const when = mine ? ` on ${new Date(mine.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "";
    return { message: `Already submitted${when}`, link, quest };
  }
  if (error) return { message: "Couldn't save, try again", link, quest };
  redirect("/quests?submitted=1");
}
