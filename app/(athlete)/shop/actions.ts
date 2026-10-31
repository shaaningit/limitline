"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/data/session";

// redeem() checks balance and stock in one database transaction, so a double tap spends once.
export async function redeem(formData: FormData) {
  const { supabase } = await requireAthlete();
  const itemId = String(formData.get("item") ?? "");
  const { error } = await supabase.rpc("redeem", { p_item: itemId });
  revalidatePath("/shop");
  if (!error) redirect("/shop?status=requested");
  if (error.message.includes("sold out")) redirect("/shop?status=sold_out");
  if (error.message.includes("not enough embers")) redirect("/shop?status=not_enough");
  redirect("/shop?status=error");
}
