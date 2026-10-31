"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";
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
