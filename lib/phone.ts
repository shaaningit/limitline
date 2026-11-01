// Phone numbers for SMS login, in the international format Supabase expects (+447700900123).
// Spaces, dashes, dots and brackets are fine to type; the country code is required.
export type PhoneResult = { ok: true; phone: string } | { ok: false; message: string };

export function normalizePhone(input: string): PhoneResult {
  const cleaned = input.trim().replace(/[\s\-().]/g, "");
  if (cleaned === "") return { ok: false, message: "Enter your phone number" };
  const withPlus = cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
  if (!withPlus.startsWith("+")) {
    return { ok: false, message: "Start with your country code, like +44 or +91" };
  }
  if (!/^\+[1-9]\d{7,14}$/.test(withPlus)) return { ok: false, message: "That doesn't look like a phone number" };
  return { ok: true, phone: withPlus };
}

// SMS codes are 6 digits; people sometimes paste them with a space in the middle.
export function normalizeCode(input: string): string | null {
  const code = input.replace(/\s/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
