import { EvolutionIntro } from "@/components/evolution-intro";
import { LoginOptions } from "./login-options";

const ERRORS: Record<string, string> = {
  google: "Google login didn't work. Try again, or use email.",
  google_not_invited: "That Google account isn't on the pilot list. Use the email the founder added.",
};

// Landing: the evolution graphic first, then the name and login options.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : "";
  return (
    <main className="landing">
      <EvolutionIntro />
      <div className="landing-hero">
        <h1 className="wordmark">LIMITLINE</h1>
        <p className="landing-tagline">Cross your limit. Get rewarded.</p>
        <p className="muted" style={{ margin: 0, maxWidth: 340 }}>
          Run, ride, swim and hike quests. Beat your own best, earn embers, spend them in the shop.
        </p>
      </div>
      <LoginOptions expired={code === "expired"} error={ERRORS[code] ?? null} />
    </main>
  );
}
