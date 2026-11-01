import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyQuests } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { formatValue } from "@/lib/format";
import { questRules } from "@/lib/rules";
import { QUESTS, QUEST_IDS, type QuestId } from "@/lib/rules/config";
import { LinkForm } from "./link-form";

export function generateStaticParams() {
  return QUEST_IDS.map((questId) => ({ questId }));
}

// Quest first, then the link: the athlete opens a quest and pastes an activity for it.
export default async function QuestPage({ params }: PageProps<"/quests/[questId]">) {
  const { questId: raw } = await params;
  if (!QUEST_IDS.includes(raw as QuestId)) notFound();
  const questId = raw as QuestId;
  const quest = QUESTS[questId];
  const rules = questRules(questId);

  const session = await requireAthlete();
  const { limits, minEfforts } = await getMyQuests(session);
  const limit = limits.find((l) => l.questId === questId)!;

  return (
    <>
      <p style={{ margin: "var(--space-2) 0 0" }}>
        <Link href="/quests" className="muted small">
          ← My quests
        </Link>
      </p>
      <h1>{quest.label}</h1>
      <p>
        Your limit:{" "}
        {limit.limit === null ? (
          <span className="muted">none yet. Your first one sets it.</span>
        ) : (
          <>
            <span className="num ok">{formatValue(questId, limit.limit)}</span>
            {limit.effortCount < minEfforts && (
              <span className="muted small">
                {" "}
                · {limit.effortCount} of {minEfforts} efforts logged
              </span>
            )}
          </>
        )}
      </p>

      <h2>What counts</h2>
      <ul className="rule-list">
        <li>{rules.counts}</li>
        <li>{rules.timedOn}</li>
        <li>{rules.rejected}</li>
        <li>Recorded after you signed up, set to Followers on Strava.</li>
      </ul>

      <LinkForm questId={questId} />
    </>
  );
}
