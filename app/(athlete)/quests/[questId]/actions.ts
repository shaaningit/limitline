"use server";

import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";
import { parseStravaLink } from "@/lib/rules";
import { QUEST_IDS, type QuestId } from "@/lib/rules/config";

export interface LinkState {
  message: string;
  link: string; // keep what they typed on errors (4A)
}

// The quest comes from the quest page the athlete opened (quest first, then link).
export async function submitLink(questId: QuestId, _prev: LinkState, formData: FormData): Promise<LinkState> {
  const { supabase, userId } = await requireAthlete();
  const link = String(formData.get("link") ?? "").trim();
  if (!QUEST_IDS.includes(questId)) return { message: "That quest doesn't exist", link };

  const parsed = parseStravaLink(link);
  if (parsed.kind === "invalid") return { message: "That's not a Strava activity link", link };

  const stravaId = parsed.kind === "activity" ? parsed.activityId : null;
  const { error } = await supabase.from("entries").insert({
    athlete_id: userId,
    quest_id: questId,
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
    return { message: `Already submitted${when}`, link };
  }
  if (error) return { message: "Couldn't save, try again", link };
  redirect("/quests?submitted=1");
}
