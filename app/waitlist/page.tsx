import type { Metadata } from "next";
import { SprintLogo } from "@/components/logo";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist · LIMITLINE",
  description: "Do a quest, post it, get rewarded with real gear. Join the LIMITLINE waitlist.",
};

const STEPS = [
  { n: "01", title: "Do a quest", body: "Run, ride, swim or hike. Strava checks it." },
  { n: "02", title: "Post it", body: "Share it on Instagram and your embers double." },
  { n: "03", title: "Get rewarded", body: "Spend embers on real gear. Brands sponsor quests." },
];

// Public sign-up page for the Instagram bio (Nov 25), open before the app is.
// Link it as /waitlist?ref=<post> to see which reel brought each person.
export default async function WaitlistPage({ searchParams }: PageProps<"/waitlist">) {
  const { ref } = await searchParams;
  return (
    <main className="waitlist">
      <div className="waitlist-glow" aria-hidden="true" />
      <header className="waitlist-head">
        <SprintLogo size={26} />
      </header>
      <section className="waitlist-hero">
        <p className="waitlist-kicker">Coming soon</p>
        <h1>
          Train. Post.
          <br />
          <span>Get rewarded.</span>
        </h1>
        <p className="waitlist-sub">
          LIMITLINE turns your training into real gear. Do quests, post them, earn embers, and spend them in the shop.
        </p>
      </section>
      <ol className="waitlist-steps">
        {STEPS.map((s) => (
          <li key={s.n}>
            <span className="waitlist-n">{s.n}</span>
            <strong>{s.title}</strong>
            <span>{s.body}</span>
          </li>
        ))}
      </ol>
      <section className="waitlist-card" aria-label="Join the waitlist">
        <WaitlistForm refCode={typeof ref === "string" ? ref : ""} />
      </section>
      <p className="waitlist-fine">We only use your email to tell you when LIMITLINE opens.</p>
    </main>
  );
}
