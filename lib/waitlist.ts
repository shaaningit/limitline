// Waitlist form rules (Nov 25). Pure functions, so they're unit-tested; the database
// re-checks the same limits (supabase/migrations/20261125000000_waitlist.sql).

export const WAITLIST_SPORTS = [
  { id: "triathlon", label: "Triathlon" },
  { id: "run", label: "Running" },
  { id: "ride", label: "Cycling" },
  { id: "swim", label: "Swimming" },
  { id: "hike", label: "Hiking" },
] as const;

export type WaitlistRole = "athlete" | "brand";

export interface WaitlistEntry {
  email: string;
  name: string;
  instagram: string; // without the @, lower case, "" if not given
  role: WaitlistRole;
  sport: string; // "" for brands or if not given
  company: string; // brands only
  ref: string; // which post sent them, "" if unknown
}

export type WaitlistParse = { ok: true; entry: WaitlistEntry } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[a-z0-9._]{1,30}$/;
const REF = /^[a-z0-9_-]{1,40}$/;

// "@Ana.Runs", "instagram.com/ana.runs/" and "ana.runs" all become "ana.runs".
export function normalizeInstagram(raw: string): string {
  let h = raw.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "").replace(/^(www\.)?instagram\.com\//, "");
  h = h.replace(/^@/, "").replace(/[/?#].*$/, "");
  return h;
}

export function parseWaitlist(raw: Record<string, string | undefined>): WaitlistParse {
  const get = (k: string) => (raw[k] ?? "").trim();
  const email = get("email").toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address" };
  const name = get("name");
  if (name.length > 80) return { ok: false, error: "Name is too long" };
  const instagram = normalizeInstagram(get("instagram"));
  if (instagram && !HANDLE.test(instagram)) return { ok: false, error: "That doesn't look like an Instagram handle" };
  const role: WaitlistRole = get("role") === "brand" ? "brand" : "athlete";
  const sportRaw = get("sport");
  const sport = role === "athlete" && WAITLIST_SPORTS.some((s) => s.id === sportRaw) ? sportRaw : "";
  const company = role === "brand" ? get("company").slice(0, 80) : "";
  if (role === "brand" && !company) return { ok: false, error: "Add your brand's name" };
  const refRaw = get("ref").toLowerCase();
  const ref = REF.test(refRaw) ? refRaw : "";
  return { ok: true, entry: { email, name, instagram, role, sport, company, ref } };
}
