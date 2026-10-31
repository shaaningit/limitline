import Link from "next/link";
import { getMyQuests, type MyEntry } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { describeResult, formatPercent, formatValue } from "@/lib/format";
import { EMBERS, QUESTS, REJECT_REASONS } from "@/lib/rules/config";
import { markSeen, tickChecklist } from "./actions";

const FOUNDER_STRAVA = process.env.NEXT_PUBLIC_FOUNDER_STRAVA_NAME ?? "the founder";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLine(e: MyEntry): string {
  const quest = QUESTS[e.quest_id].label;
  if (e.status === "waiting") return `${quest} · Waiting for check`;
  if (e.status === "rejected") return `${quest} · ${REJECT_REASONS[e.reject_reason!]}`;
  if (e.percent === null) return `${quest} · Quest done · +${e.embers} embers`;
  return e.beat_limit
    ? `${quest} · ${formatPercent(Number(e.percent))} beyond your limit · ${e.embers} embers`
    : `${quest} · Quest done · +${e.embers} embers`;
}

export default async function QuestsPage({ searchParams }: PageProps<"/quests">) {
  const { submitted } = await searchParams;
  const session = await requireAthlete();
  const { profile } = session;
  const { entries, limits, balance, unseen, minEfforts } = await getMyQuests(session);
  const firstRunDone = profile.checklist_followed && profile.checklist_visibility && entries.length > 0;

  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>My quests</h1>
        <Link className="button" href="/profile" aria-label={`Profile and settings for ${profile.display_name}`}>
          {initials(profile.display_name)}
        </Link>
      </header>

      {submitted === "1" && (
        <p role="status" className="result-card" style={{ padding: "var(--space-2)" }}>
          Got it! Waiting for check.
        </p>
      )}

      {/* 1: embers balance (opens "How embers work", 8A) */}
      <p style={{ marginTop: "var(--space-2)" }}>
        <Link className="chip" href="/quests/embers" aria-label={`${balance} embers. How embers work`}>
          {balance} embers
        </Link>
      </p>

      {/* First run (7A): above everything else until done */}
      {!firstRunDone && (
        <section aria-labelledby="first-run">
          <h2 id="first-run">Get set up</h2>
          <ol className="rows checklist">
            <li>
              <ChecklistStep
                done={profile.checklist_followed}
                step="checklist_followed"
                text={`Follow ${FOUNDER_STRAVA} on Strava`}
              />
            </li>
            <li>
              <ChecklistStep
                done={profile.checklist_visibility}
                step="checklist_visibility"
                text="Set your Strava activity visibility to Followers (Strava → Settings → Privacy Controls)"
              />
            </li>
            <li>{entries.length > 0 ? "✓ " : ""}Paste your first link</li>
          </ol>
        </section>
      )}

      {/* 2: the main action */}
      <p style={{ marginTop: "var(--space-3)" }}>
        <Link className="button button-primary button-block" href="/submit">
          Paste a Strava link
        </Link>
      </p>

      {/* 3: new results (5A), each card until seen */}
      {unseen.map((e) => (
        <ResultCard key={e.id} entry={e} />
      ))}

      <section aria-labelledby="results">
        <h2 id="results">Your activities</h2>
        {entries.length === 0 ? (
          <p className="muted">No activities yet. Paste your first Strava link.</p>
        ) : (
          <ul className="rows">
            {entries.slice(0, 20).map((e) => (
              <li key={e.id}>
                <span>{statusLine(e)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4: limits per quest */}
      <section aria-labelledby="limits">
        <h2 id="limits">Your limits</h2>
        <ul className="rows">
          {limits.map((l) => (
            <li key={l.questId}>
              <span>{QUESTS[l.questId].label}</span>
              {l.limit === null ? (
                <span className="muted small">No limit yet</span>
              ) : l.effortCount < minEfforts ? (
                <span className="small">
                  <span className="num">{formatValue(l.questId, l.limit)}</span> · {l.effortCount} of {minEfforts} efforts
                  logged
                </span>
              ) : (
                <span className="num">{formatValue(l.questId, l.limit)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ChecklistStep({ done, step, text }: { done: boolean; step: string; text: string }) {
  if (done) return <span>✓ {text}</span>;
  return (
    <form action={tickChecklist} style={{ display: "flex", gap: "var(--space-1)", alignItems: "center", width: "100%" }}>
      <input type="hidden" name="step" value={step} />
      <span style={{ flex: 1 }}>{text}</span>
      <button className="button" type="submit">
        Done
      </button>
    </form>
  );
}

function ResultCard({ entry }: { entry: MyEntry }) {
  const percent = entry.percent === null ? null : Number(entry.percent);
  const doubled = Boolean(entry.beat_limit) && Number(entry.embers) > EMBERS.base;
  return (
    <section className="result-card" aria-label={`New result: ${QUESTS[entry.quest_id].label}`}>
      <p className="muted small" style={{ margin: 0 }}>
        {QUESTS[entry.quest_id].label} · {formatValue(entry.quest_id, Number(entry.value))}
      </p>
      {entry.beat_limit && percent !== null ? (
        <>
          <p className="hero-number" aria-hidden="true" style={{ margin: "var(--space-1) 0" }}>
            {formatPercent(percent)}
          </p>
          <p>
            <span className="visually-hidden">{describeResult(percent, true, doubled)}. </span>
            <span aria-hidden="true">beyond your limit</span>{" "}
            <span className="badge">{doubled ? `2× embers · +${entry.embers}` : `+${entry.embers} embers`}</span>
          </p>
        </>
      ) : (
        <p style={{ margin: "var(--space-1) 0" }}>
          Quest done · +{entry.embers} embers
          {percent !== null && <span className="muted"> · {describeResult(percent, false, false)}</span>}
        </p>
      )}
      <form action={markSeen}>
        <input type="hidden" name="id" value={entry.id} />
        <button className="button" type="submit">
          Got it
        </button>
      </form>
    </section>
  );
}
