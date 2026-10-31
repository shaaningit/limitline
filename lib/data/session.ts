import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  display_name: string;
  is_founder: boolean;
  show_on_boards: boolean;
  show_name_on_share: boolean;
  checklist_followed: boolean;
  checklist_visibility: boolean;
  signed_up_at: string;
  email: string | null;
}

// The signed-in user and their profile, or null. Every page and action checks access
// through here on the server, never only in the UI (eng review: admin lock is server-side).
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return { supabase, userId, profile };
}

// For athlete pages: signed in with a profile, otherwise sent to login or profile setup.
export async function requireAthlete() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.profile) redirect("/welcome");
  return { ...session, profile: session.profile };
}

// For admin pages and actions: only the founder. Anyone else is sent back to My quests.
export async function requireFounder() {
  const session = await requireAthlete();
  if (!session.profile.is_founder) redirect("/quests");
  return session;
}
