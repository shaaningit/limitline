import "server-only";
import { after } from "next/server";
import { sendNotices } from "@/lib/data/admin";
import type { DbEntry } from "@/lib/data/plan";
import type { Seed } from "@/lib/rules";
import type { QuestId } from "@/lib/rules/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivity, getDistanceStream, getLaps, getWattsStream } from "./api";
import { autoCheck, type AutoCheckOutcome } from "./auto-check";
import { stravaEnabled } from "./config";
import { accessToken, getConnection } from "./connection";

// Runs the automatic Strava check for one just-submitted entry, with the server's own
// database access. The caller must already have confirmed the entry belongs to `athleteId`.
export async function runAutoCheck(athleteId: string, entryId: string): Promise<AutoCheckOutcome> {
  if (!stravaEnabled()) return { status: "skipped" };
  const admin = createAdminClient();
  const write = async (rows: Record<string, unknown>[]) => {
    const { error } = await admin.rpc("apply_entry_rows", { p_rows: rows });
    if (error) throw new Error("Couldn't save the Strava check");
  };

  const outcome = await autoCheck(
    {
      async connection(id) {
        const conn = await getConnection(admin, id);
        return conn ? { stravaAthleteId: Number(conn.strava_athlete_id), token: () => accessToken(admin, conn, new Date()) } : null;
      },
      async load(id) {
        const [entriesRes, seedsRes, profileRes] = await Promise.all([
          admin
            .from("entries")
            .select("id, quest_id, status, strava_activity_id, activity_at, value, percent, beat_limit, embers")
            .eq("athlete_id", id),
          admin.from("seed_limits").select("quest_id, value, effort_count").eq("athlete_id", id),
          admin.from("profiles").select("signed_up_at").eq("id", id).single(),
        ]);
        if (entriesRes.error || seedsRes.error || profileRes.error) throw new Error("Couldn't load the athlete's history");
        const seeds: Seed[] = (seedsRes.data ?? []).map((s) => ({
          questId: s.quest_id as QuestId,
          value: Number(s.value),
          effortCount: s.effort_count,
        }));
        return { entries: (entriesRes.data ?? []) as DbEntry[], seeds, signedUpAt: new Date(profileRes.data.signed_up_at) };
      },
      strava: { getActivity, getWattsStream, getLaps, getDistanceStream },
      write,
      now: () => new Date(),
    },
    athleteId,
    entryId,
  );

  if (outcome.status === "verified" && outcome.notices.length > 0) {
    after(() => sendNotices(admin, outcome.notices, outcome.embersBefore, write));
  }
  return outcome;
}
