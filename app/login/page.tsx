import { Logo } from "@/components/logo";
import { LoginOptions } from "./login-options";

// Landing (logo first): the brand fills the screen, login options sit under it.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="landing">
      <div className="landing-hero">
        <h1 style={{ margin: 0 }}>
          <Logo size={44} />
        </h1>
        <p className="landing-tagline">Cross your limit. Get rewarded.</p>
        <p className="muted" style={{ margin: 0, maxWidth: 320 }}>
          Run, ride and swim quests. Beat your own best, earn embers, spend them in the shop.
        </p>
      </div>
      <LoginOptions expired={error === "expired"} />
    </main>
  );
}
