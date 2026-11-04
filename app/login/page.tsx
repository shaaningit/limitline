import { EvolutionIntro } from "@/components/evolution-intro";
import { Logo } from "@/components/logo";
import { LoginOptions } from "./login-options";

const ERRORS: Record<string, string> = {
  google: "Google login didn't work. Try again, or use email.",
  google_not_invited: "That Google account isn't on the pilot list. Use the email the founder added.",
};

// Opening screen (premium, Nov 4): the evolution graphic with the logo over it, the headline,
// then the way in.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : "";
  return (
    <main className="landing">
      <div className="hero-stage">
        <EvolutionIntro />
        <div className="hero-top">
          <Logo size={19} />
        </div>
      </div>
      <div className="landing-hero">
        <p className="eyebrow">Run · Ride · Swim · Hike</p>
        <h1 className="headline">
          Cross your limit.
          <br />
          <span className="volt">Get rewarded.</span>
        </h1>
        <p className="landing-sub">Quests that measure you against your own best. Beat it, earn embers, spend them on real gear.</p>
      </div>
      <div className="landing-auth">
        <LoginOptions expired={code === "expired"} error={ERRORS[code] ?? null} />
      </div>
    </main>
  );
}
