"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";
import { normalizeCode, normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const { supabase, userId } = await requireAthlete();
  await supabase
    .from("profiles")
    .update({
      show_on_boards: formData.get("show_on_boards") === "on",
      show_name_on_share: formData.get("show_name_on_share") === "on",
    })
    .eq("id", userId);
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface AddPhoneState {
  step: "number" | "code" | "done";
  message: string;
  phone: string;
}

// Link a phone number to this account so it can be used to log in. Supabase texts a code
// to prove the number is theirs; nothing changes until the code is checked.
export async function addPhone(prev: AddPhoneState, formData: FormData): Promise<AddPhoneState> {
  const { supabase } = await requireAthlete();
  const step = formData.get("step");
  if (step === "change") return { step: "number", message: "", phone: prev.phone };

  if (step === "code") {
    const code = normalizeCode(String(formData.get("code") ?? ""));
    if (!code) return { ...prev, step: "code", message: "Enter the 6-digit code from the text" };
    const { error } = await supabase.auth.verifyOtp({ phone: prev.phone, token: code, type: "phone_change" });
    if (error) return { ...prev, step: "code", message: "That code didn't work. Check it, or send a new one." };
    revalidatePath("/profile");
    return { step: "done", message: "", phone: prev.phone };
  }

  const typed = String(formData.get("phone") ?? "");
  const parsed = normalizePhone(typed);
  if (!parsed.ok) return { step: "number", message: parsed.message, phone: typed };
  const { error } = await supabase.auth.updateUser({ phone: parsed.phone });
  if (error?.code === "phone_exists") {
    return { step: "number", message: "That number is already linked to another account", phone: typed };
  }
  if (error?.code === "over_sms_send_rate_limit") {
    return { step: "number", message: "Too many texts just now. Wait a minute, then try again.", phone: typed };
  }
  if (error) return { step: "number", message: "Couldn't send the text, try again", phone: typed };
  return { step: "code", message: "", phone: parsed.phone };
}
