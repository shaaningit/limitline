"use server";

import { redirect } from "next/navigation";
import { normalizeCode, normalizePhone } from "@/lib/phone";
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
  if (isNotInvited(error)) {
    return { status: "error", message: "This email isn't on the pilot list yet. Ask the founder to add you.", email };
  }
  if (error) return { status: "error", message: "Couldn't send the email, try again", email };
  return { status: "sent", message: "Check your email" };
}

// Supabase reports a login for someone not on the pilot list as one of these
// (exact code not yet confirmed live).
function isNotInvited(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === "otp_disabled" ||
    error?.code === "signup_disabled" ||
    Boolean(error?.message?.toLowerCase().includes("signups not allowed"))
  );
}

// Google: Supabase sends the athlete to Google and back to /auth/callback. Because new
// sign-ups are off, only a Google account whose email is already on the pilot list gets in.
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.APP_URL}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export interface PhoneState {
  step: "number" | "code";
  message: string;
  phone: string; // kept between steps and shown again after an error
}

// Phone: step 1 texts a 6-digit code, step 2 checks it. Only numbers already linked to a
// pilot account work (athletes add theirs in Profile), so this never creates an account.
export async function phoneLogin(prev: PhoneState, formData: FormData): Promise<PhoneState> {
  const step = formData.get("step");
  if (step === "change") return { step: "number", message: "", phone: prev.phone };
  const supabase = await createClient();

  if (step === "code") {
    const code = normalizeCode(String(formData.get("code") ?? ""));
    if (!code) return { ...prev, step: "code", message: "Enter the 6-digit code from the text" };
    const { error } = await supabase.auth.verifyOtp({ phone: prev.phone, token: code, type: "sms" });
    if (error) return { ...prev, step: "code", message: "That code didn't work. Check it, or send a new one." };
    redirect("/quests");
  }

  const typed = String(formData.get("phone") ?? "");
  const parsed = normalizePhone(typed);
  if (!parsed.ok) return { step: "number", message: parsed.message, phone: typed };
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.phone,
    options: { shouldCreateUser: false, channel: "sms" },
  });
  if (isNotInvited(error)) {
    return {
      step: "number",
      message: "This number isn't linked to a pilot account. Log in with email or Google, then add it in Profile.",
      phone: typed,
    };
  }
  if (error?.code === "over_sms_send_rate_limit") {
    return { step: "number", message: "Too many texts just now. Wait a minute, then try again.", phone: typed };
  }
  if (error) return { step: "number", message: "Couldn't send the text, try again", phone: typed };
  return { step: "code", message: "", phone: parsed.phone };
}
