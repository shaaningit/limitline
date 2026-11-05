import { LandingFilm } from "@/components/landing-film";
import { LoginOptions } from "./login-options";

const ERRORS: Record<string, string> = {
  google: "Google login didn't work. Try again, or use email.",
  google_not_invited: "That Google account isn't on the pilot list. Use the email the founder added.",
};

// Opening screen (Nov 5): a six-chapter film on the evolution of greatness and stoicism,
// ending on the way in.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : "";
  return (
    <main className="landing">
      <LandingFilm>
        <LoginOptions expired={code === "expired"} error={ERRORS[code] ?? null} />
      </LandingFilm>
    </main>
  );
}
