"use server";

import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message: string;
  email?: string; // shown again after an error (React clears forms after an action)
}

export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address", email };
  }
  const supabase = await createClient();
  // Invite-only pilot: the founder adds athletes in Supabase (SETUP.md), so boards stay
  // members-only. Logging in never creates a new account.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.APP_URL}/auth/confirm`, shouldCreateUser: false },
  });
  // Supabase reports an uninvited email as one of these (exact code not yet confirmed live).
  const notInvited =
    error?.code === "otp_disabled" ||
    error?.code === "signup_disabled" ||
    error?.message?.toLowerCase().includes("signups not allowed");
  if (notInvited) {
    return { status: "error", message: "This email isn't on the pilot list yet. Ask the founder to add you.", email };
  }
  if (error) return { status: "error", message: "Couldn't send the email, try again", email };
  return { status: "sent", message: "Check your email" };
}
