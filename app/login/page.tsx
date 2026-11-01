import { Logo } from "@/components/logo";
import { LoginOptions } from "./login-options";

const ERRORS: Record<string, string> = {
  google: "Google login didn't work. Try again, or use email.",
  google_not_invited: "That Google account isn't on the pilot list. Use the email the founder added.",
};

// Landing (logo first): the brand fills the screen, login options sit under it.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : "";
  return (
    <main className="landing">
      <div className="landing-hero">
        <h1 style={{ margin: 0 }}>
          <Logo size={48} stacked />
        </h1>
        <p className="landing-tagline">Cross your limit. Get rewarded.</p>
        <p className="muted" style={{ margin: 0, maxWidth: 320 }}>
          Run, ride and swim quests. Beat your own best, earn embers, spend them in the shop.
        </p>
      </div>
      <LoginOptions expired={code === "expired"} error={ERRORS[code] ?? null} />
    </main>
  );
}
