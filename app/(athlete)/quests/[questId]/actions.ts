"use server";

import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";
import { parseStravaLink } from "@/lib/rules";
import { QUEST_IDS, type QuestId } from "@/lib/rules/config";
import { stravaEnabled } from "@/lib/strava/config";
import { runAutoCheck } from "@/lib/strava/run";
import { resolveShortLink } from "@/lib/strava/short-link";

export interface LinkState {
  message: string;
  link: string; // keep what they typed on errors (4A)
}

// The quest comes from the quest page the athlete opened (quest first, then link).
// With Strava connected, the activity is checked right away; otherwise it waits for the founder.
export async function submitLink(questId: QuestId, _prev: LinkState, formData: FormData): Promise<LinkState> {
  const { supabase, userId } = await requireAthlete();
  const link = String(formData.get("link") ?? "").trim();
  if (!QUEST_IDS.includes(questId)) return { message: "That quest doesn't exist", link };

  const parsed = parseStravaLink(link);
  if (parsed.kind === "invalid") return { message: "That's not a Strava activity link", link };

  // Share links from the Strava app (strava.app.link) are turned into the activity number
  // when possible, so they can be checked automatically and counted only once.
  let stravaId = parsed.kind === "activity" ? parsed.activityId : null;
  if (parsed.kind === "short" && stravaEnabled()) stravaId = await resolveShortLink(parsed.url);
  const storedLink = stravaId ? `https://www.strava.com/activities/${stravaId}` : parsed.kind === "short" ? parsed.url : link;

  const { data: inserted, error } = await supabase
    .from("entries")
    .insert({ athlete_id: userId, quest_id: questId, link: storedLink, strava_activity_id: stravaId })
    .select("id")
    .single();

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
  if (error || !inserted) return { message: "Couldn't save, try again", link };

  // The entry is saved either way; a failed check just leaves it for the founder.
  let outcome: Awaited<ReturnType<typeof runAutoCheck>>;
  try {
    outcome = await runAutoCheck(userId, inserted.id);
  } catch {
    outcome = { status: "founder", note: "" };
  }
  const params = new URLSearchParams({ submitted: outcome.status });
  if (outcome.status === "rejected") params.set("reason", outcome.reason);
  redirect(`/quests?${params}`);
}
