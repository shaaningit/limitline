"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/data/session";

export interface WelcomeState {
  message: string;
  first?: string;
  initial?: string;
}

// Boards show "First L." (design 3A), so we ask for first name and last initial.
export async function createProfile(_prev: WelcomeState, formData: FormData): Promise<WelcomeState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile) redirect("/quests");

  const first = String(formData.get("first") ?? "").trim();
  const initial = String(formData.get("initial") ?? "").trim().charAt(0).toUpperCase();
  if (!first || first.length > 30) return { message: "Enter your first name (up to 30 letters)", first, initial };
  if (!/^[A-Z]$/.test(initial)) return { message: "Enter the first letter of your last name", first, initial };

  // The email comes from the verified login, not the form, so it can't be someone else's.
  const { data } = await session.supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  const { error } = await session.supabase
    .from("profiles")
    .insert({ id: session.userId, display_name: `${first} ${initial}.`, email });
  if (error) return { message: "Couldn't save, try again", first, initial };
  redirect("/quests");
}
