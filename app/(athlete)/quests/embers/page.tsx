import Link from "next/link";
import { embersExplainer } from "@/lib/rules";

// "How embers work" (8A). Numbers come from lib/rules/config.ts, so they can't drift.
export default function EmbersPage() {
  return (
    <>
      <h1>How embers work</h1>
      <ul className="rows">
        {embersExplainer().map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p style={{ marginTop: "var(--space-3)" }}>
        <Link className="button" href="/quests">
          Back to My quests
        </Link>
      </p>
    </>
  );
}
