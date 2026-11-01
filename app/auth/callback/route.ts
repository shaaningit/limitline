import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the athlete back here with a one-time code, which becomes their session.
// If Google or Supabase refused (for example, the Google email isn't on the pilot list),
// Supabase adds an error instead and the landing screen explains it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/quests", origin));
  }
  const notInvited = (searchParams.get("error_description") ?? "").toLowerCase().includes("signup");
  return NextResponse.redirect(new URL(`/login?error=${notInvited ? "google_not_invited" : "google"}`, origin));
}
