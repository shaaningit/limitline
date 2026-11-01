// Which login buttons the landing screen shows. Email always works; Google and phone
// need setup in Supabase first (SETUP.md), so each is switched on with its own setting.
export const LOGIN_OPTIONS = {
  google: process.env.NEXT_PUBLIC_LOGIN_GOOGLE === "on",
  phone: process.env.NEXT_PUBLIC_LOGIN_PHONE === "on",
};
