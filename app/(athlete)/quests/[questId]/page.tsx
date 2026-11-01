import Link from "next/link";
import { notFound } from "next/navigation";
import { StravaConnectButton, StravaReturnMessage } from "@/components/strava-connect";
import { getMyQuests, getMyStrava } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { formatValue } from "@/lib/format";
import { questRules } from "@/lib/rules";
import { QUESTS, QUEST_IDS, type QuestId } from "@/lib/rules/config";
import { stravaEnabled } from "@/lib/strava/config";
import { LinkForm } from "./link-form";

export function generateStaticParams() {
  return QUEST_IDS.map((questId) => ({ questId }));
}

// Quest first, then the link: the athlete opens a quest and pastes an activity for it.
export default async function QuestPage({ params, searchParams }: PageProps<"/quests/[questId]">) {
  const { questId: raw } = await params;
  const { strava: stravaReturn } = await searchParams;
  if (!QUEST_IDS.includes(raw as QuestId)) notFound();
  const questId = raw as QuestId;
  const quest = QUESTS[questId];
  const rules = questRules(questId);

  const session = await requireAthlete();
  const [{ limits, minEfforts }, strava] = await Promise.all([getMyQuests(session), getMyStrava(session)]);
  const enabled = stravaEnabled();
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
        <li>Recorded after you signed up, with a watch or phone (not typed in), visible to Everyone or Followers on Strava.</li>
      </ul>

      <StravaReturnMessage status={stravaReturn} />
      <LinkForm questId={questId} instant={enabled && Boolean(strava)} />

      {enabled && strava && (
        <p className="muted small" style={{ marginTop: "var(--space-2)" }}>
          Checked with your Strava in seconds. Big jumps (over 10% beyond your limit) get a quick look from the founder.
          Powered by Strava.
        </p>
      )}
      {enabled && !strava && (
        <div style={{ marginTop: "var(--space-3)" }}>
          <p className="muted small">Without Strava connected, the founder checks your link by hand. Connect it for results in seconds.</p>
          <StravaConnectButton next={`/quests/${questId}`} />
        </div>
      )}
    </>
  );
}
