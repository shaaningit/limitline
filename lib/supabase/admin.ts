import "server-only";
import { createClient } from "@supabase/supabase-js";

// The server's own database access, with the secret key (Postgres role service_role).
// Used ONLY by the automatic Strava check and the Strava connection (lib/strava), because
// athletes must never be able to approve their own entries or read Strava tokens.
// Every other page and action uses the signed-in user's client (lib/supabase/server.ts).
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
