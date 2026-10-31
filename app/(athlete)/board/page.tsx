import Link from "next/link";
import { currentWeek, getBoard } from "@/lib/data/athlete";
import { requireAthlete } from "@/lib/data/session";
import { formatPercent } from "@/lib/format";
import { BOARDS, type Sport } from "@/lib/rules/config";

const LABELS: Record<Sport, string> = { run: "Run", bike: "Bike", swim: "Swim" };

// Weekly boards ranked by % beyond own limit; no raw times or watts (3A, D16).
export default async function BoardPage({ searchParams }: PageProps<"/board">) {
  const session = await requireAthlete();
  const { sport: raw } = await searchParams;
  const sport: Sport = BOARDS.includes(raw as Sport) ? (raw as Sport) : "run";
  const week = currentWeek();
  const board = await getBoard(session, sport, week);
  const me = board.rows.find((r) => r.isMe);

  return (
    <>
      <h1>This week</h1>
      <p className="muted small">Ranked by % beyond each athlete&apos;s own limit. Resets every Monday.</p>
      <nav className="tabs" aria-label="Boards">
        {BOARDS.map((s) => (
          <Link key={s} className="button" href={`/board?sport=${s}`} aria-current={s === sport ? "page" : undefined}>
            {LABELS[s]}
          </Link>
        ))}
      </nav>

      {!session.profile.show_on_boards && (
        <p className="muted">You&apos;re hidden from boards (change in Profile).</p>
      )}

      {/* Own row pinned at the top (3A) */}
      {me && (
        <p className="result-card" style={{ padding: "var(--space-2)" }}>
          You: #{me.rank} · {me.questLabel} · <span className="num">{formatPercent(me.percent)}</span>
        </p>
      )}

      {board.rows.length === 0 ? (
        <p>
          Nobody beat their limit yet this week · {board.othersCompleted}{" "}
          {board.othersCompleted === 1 ? "athlete" : "athletes"} completed quests
        </p>
      ) : (
        <ol className="rows" aria-label={`${LABELS[sport]} board`}>
          {board.rows.map((row) => (
            <li key={row.athleteId} className={row.isMe ? "me" : undefined}>
              <span>
                <span className="num">{row.rank}</span> · {row.displayName}
                {row.isMe && <span className="visually-hidden"> (you)</span>}
                <span className="muted small"> · {row.questLabel}</span>
              </span>
              <span className="num">{formatPercent(row.percent)}</span>
            </li>
          ))}
        </ol>
      )}

      {board.rows.length > 0 && board.othersCompleted > 0 && (
        <p className="muted" style={{ marginTop: "var(--space-2)" }}>
          {board.othersCompleted} others completed quests this week
        </p>
      )}
    </>
  );
}
