import Link from "next/link";
import { Reveal } from "@/components/motion";
import { BikeIcon, ChevronIcon, EmberIcon, FlameIcon, HikeIcon, RunIcon, SwimIcon } from "@/components/icons";
import { ShareButton } from "@/components/share-button";
import { StravaConnectButton, StravaReturnMessage } from "@/components/strava-connect";
import { getMyQuests, getMyStrava, type MyEntry } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { describeResult, formatPercent, formatValue } from "@/lib/format";
import { BOARDS, EMBERS, QUESTS, REJECT_REASONS, SPORT_LABELS, type RejectReason, type Sport } from "@/lib/rules/config";
import { stravaEnabled } from "@/lib/strava/config";
import { markSeen, tickChecklist } from "./actions";

const FOUNDER_STRAVA = process.env.NEXT_PUBLIC_FOUNDER_STRAVA_NAME ?? "the founder";

const SPORT_ICONS: Record<Sport, typeof RunIcon> = { run: RunIcon, bike: BikeIcon, swim: SwimIcon, hike: HikeIcon };

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
  const { submitted, reason, strava: stravaReturn } = await searchParams;
  const session = await requireAthlete();
  const { profile } = session;
  const [{ entries, limits, streak, week, balance, unseen, minEfforts }, strava] = await Promise.all([getMyQuests(session), getMyStrava(session)]);
  const offerStrava = stravaEnabled() && !strava;
  const firstRunDone = profile.checklist_followed && profile.checklist_visibility && entries.length > 0;

  return (
    <>
      <Reveal />
      <h1 className="ltitle" style={{ marginTop: "var(--space-3)" }}>
        My quests
      </h1>

      {/* This week: streak, embers and the days you showed up, as one card with depth */}
      <section className="today tilt rv" data-tilt="6" aria-label="This week">
        <span className="today-orb" aria-hidden="true" />
        <div className="today-top">
          <span className="eyebrow">This week</span>
          <Link href="/quests/embers" className="muted small">
            How embers work
          </Link>
        </div>
        <div className="today-main">
          <div>
            <span
              className={`today-big streak${streak.weeks > 0 ? "" : " cold"}`}
              aria-label={`${streak.weeks}-week streak${streak.weeks > 0 && !streak.activeThisWeek ? ", log an activity this week to keep it" : ""}`}
            >
              <FlameIcon size={30} />
              <span aria-hidden="true">{streak.weeks}</span>
            </span>
            <div className="today-label">{streak.weeks === 1 ? "week" : "weeks"} in a row</div>
          </div>
          <div>
            <Link className="today-big embers" href="/quests/embers" aria-label={`${balance} embers. How embers work`}>
              <EmberIcon size={30} />
              <span aria-hidden="true">{balance}</span>
            </Link>
            <div className="today-label">embers to spend</div>
          </div>
        </div>
        <div className="week-days" aria-label={`Activities on ${week.activeDays.length} of 7 days this week`}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className={`${week.activeDays.includes(i) ? "done" : ""} ${i === week.today ? "today-mark" : ""}`}>
              <i />
              {d}
            </span>
          ))}
        </div>
      </section>

      {streak.weeks > 0 && !streak.activeThisWeek && (
        <p className="nudge rv" role="status">
          <FlameIcon size={20} /> Keep your {streak.weeks}-week streak: log one activity before Sunday ends.
        </p>
      )}

      <SubmittedMessage submitted={submitted} reason={reason} offerStrava={offerStrava} />
      <StravaReturnMessage status={stravaReturn} />

      {/* Instant checks: shown until the athlete connects Strava */}
      {offerStrava && (
        <section className="result-card" aria-labelledby="strava-offer">
          <h2 id="strava-offer" style={{ marginTop: 0 }}>
            Get results in seconds
          </h2>
          <p className="muted">Connect Strava once and every link you paste is checked straight away, instead of waiting for the founder.</p>
          <StravaConnectButton next="/quests" />
        </section>
      )}

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
            <li>{entries.length > 0 ? "✓ " : ""}Pick a quest below and paste your first link</li>
          </ol>
        </section>
      )}

      {/* New results (5A), each card until seen */}
      {unseen.map((e) => (
        <ResultCard key={e.id} entry={e} />
      ))}

      {/* The main action: pick a quest, then paste the link on its page. Grouped by sport. */}
      {BOARDS.map((sport) => {
        const group = limits.filter((l) => QUESTS[l.questId].sport === sport);
        return (
          <section key={sport} aria-labelledby={`quests-${sport}`}>
            <h2 id={`quests-${sport}`} className="rv">
              {SPORT_LABELS[sport]} <span className="muted small">{group.length} quests</span>
            </h2>
            <ul className="quest-cards">
              {group.map((l) => {
                const quest = QUESTS[l.questId];
                const Icon = SPORT_ICONS[quest.sport];
                const unlocked = l.effortCount >= minEfforts;
                return (
                  <li key={l.questId} className="rv">
                    <Link href={`/quests/${l.questId}`} className="tilt" data-tilt="4">
                      <span className={`sport-badge ${quest.sport}`}>
                        <Icon size={26} />
                      </span>
                      <span className="quest-text">
                        <span className="quest-name">{quest.label}</span>
                        <span className="muted small">
                          {l.limit === null ? (
                            "No limit yet: your first one sets it"
                          ) : (
                            <>
                              Limit <span className="num">{formatValue(l.questId, l.limit)}</span>
                            </>
                          )}
                        </span>
                        <span className="progress" aria-label={unlocked ? "Double embers unlocked" : `${l.effortCount} of ${minEfforts} efforts to unlock double embers`}>
                          <span className="progress-track">
                            <span className="progress-fill" style={{ width: `${Math.min(100, (l.effortCount / minEfforts) * 100)}%` }} />
                          </span>
                          <span className="progress-label" aria-hidden="true">
                            {unlocked ? "2× unlocked" : `${l.effortCount}/${minEfforts}`}
                          </span>
                        </span>
                      </span>
                      <ChevronIcon className="go" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="results">
        <h2 id="results">Your activities</h2>
        {entries.length === 0 ? (
          <p className="muted">No activities yet. Pick a quest above and paste your first Strava link.</p>
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

    </>
  );
}

// What happened to the link just pasted (?submitted=verified|rejected|founder|skipped).
function SubmittedMessage({
  submitted,
  reason,
  offerStrava,
}: {
  submitted: string | string[] | undefined;
  reason: string | string[] | undefined;
  offerStrava: boolean;
}) {
  let text: string | null = null;
  let ok = true;
  if (submitted === "verified") text = "Checked with Strava. Your result is below.";
  if (submitted === "rejected") {
    ok = false;
    const why = typeof reason === "string" && reason in REJECT_REASONS ? REJECT_REASONS[reason as RejectReason] : null;
    text = `Checked with Strava: not approved${why ? `. ${why}` : ""}.`;
  }
  if (submitted === "founder") text = "Got it! This one needs a quick check by the founder. You'll get an email.";
  if (submitted === "skipped" || submitted === "1") {
    text = offerStrava ? "Got it! Waiting for check. Connect Strava below to get results in seconds." : "Got it! Waiting for check.";
  }
  if (!text) return null;
  return (
    <p role={ok ? "status" : "alert"} className="result-card" style={{ padding: "var(--space-2)" }}>
      {ok ? <span className="ok">✓ </span> : <span className="error">✕ </span>}
      {text}
    </p>
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
    <section className="result-card tilt rv" data-tilt="5" aria-label={`New result: ${QUESTS[entry.quest_id].label}`}>
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
      <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
        {entry.beat_limit && <ShareButton entryId={entry.id} title="Beyond my limit on LIMITLINE" />}
        <form action={markSeen}>
          <input type="hidden" name="id" value={entry.id} />
          <button className="button" type="submit">
            Got it
          </button>
        </form>
      </div>
    </section>
  );
}
