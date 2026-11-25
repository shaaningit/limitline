"use server";

import { parseWaitlist, type WaitlistRole } from "@/lib/waitlist";
import { createClient } from "@/lib/supabase/server";

export interface WaitlistState {
  status: "idle" | "joined" | "error";
  message: string;
  position?: number;
  role?: WaitlistRole;
  values?: Record<string, string>; // shown again after an error (React clears forms after an action)
}

const FIELDS = ["email", "name", "instagram", "role", "sport", "company", "ref", "website"] as const;

export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const raw = Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  // "website" is a hidden field people never see. Bots fill it in; pretend it worked.
  if (raw.website) return { status: "joined", message: "", role: "athlete" };

  const parsed = parseWaitlist(raw);
  if (!parsed.ok) return { status: "error", message: parsed.error, values: raw };
  const e = parsed.entry;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_waitlist", {
    p_email: e.email,
    p_name: e.name,
    p_instagram: e.instagram,
    p_role: e.role,
    p_sport: e.sport,
    p_company: e.company,
    p_ref: e.ref,
  });
  if (error || typeof data !== "number") {
    return { status: "error", message: "Couldn't save that. Try again in a moment.", values: raw };
  }
  return { status: "joined", message: "", position: data, role: e.role };
}
