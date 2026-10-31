import Link from "next/link";
import { getEntry, getFailedEmails, getHistory, getQueue } from "@/lib/data/admin";
import { requireFounder } from "@/lib/data/session";
import { formatValue } from "@/lib/format";
import { limitBefore, type VerifiedEntry } from "@/lib/rules";
import { PILOT_TIME_ZONE, QUESTS, QUEST_IDS, type QuestId } from "@/lib/rules/config";
import { utcToZonedLocal } from "@/lib/time";
import { retryEmailAction } from "./actions";
import { EntryForm } from "./entry-form";

// Queue (oldest first) on the left, entry form on the right (12A, 14A).
export default async function AdminQueuePage({ searchParams }: PageProps<"/admin">) {
  const { supabase } = await requireFounder();
  const { entry: entryParam } = await searchParams;
  const [queue, failed] = await Promise.all([getQueue(supabase), getFailedEmails(supabase)]);

  const selectedId = typeof entryParam === "string" ? entryParam : queue[0]?.id;
  const selected = selectedId ? await getEntry(supabase, selectedId) : null;

  let limits: Record<QuestId, string> | null = null;
  if (selected) {
    const { entries, seeds } = await getHistory(supabase, selected.athlete_id);
    const verified: VerifiedEntry[] = entries
      .filter((e) => e.status === "verified" && e.id !== selected.id)
      .map((e) => ({ id: e.id, questId: e.quest_id, value: Number(e.value), activityAt: new Date(e.activity_at!) }));
    const at = selected.activity_at ? new Date(selected.activity_at) : new Date(8.64e15);
    limits = Object.fromEntries(
      QUEST_IDS.map((q) => {
        const state = limitBefore(q, seeds.find((s) => s.questId === q), verified, at);
        return [
          q,
          state.limit === null
            ? `none yet (${state.effortCount} efforts)`
            : `${formatValue(q, state.limit)} (${state.effortCount} efforts)`,
        ];
      }),
    ) as Record<QuestId, string>;
  }

  return (
    <div className="admin-panes">
      <section aria-labelledby="queue">
        <h1 id="queue">Queue ({queue.length})</h1>
        {queue.length === 0 ? (
          <p className="muted">Nothing waiting. Nice.</p>
        ) : (
          <ol className="rows">
            {queue.map((e) => (
              <li key={e.id} className={e.id === selectedId ? "me" : undefined}>
                <Link href={`/admin?entry=${e.id}`} aria-current={e.id === selectedId ? "true" : undefined}>
                  {e.profiles?.display_name} · {QUESTS[e.quest_id].label}
                </Link>
                <span className="muted small">
                  {new Date(e.submitted_at).toLocaleString("en-GB", { timeZone: PILOT_TIME_ZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ol>
        )}

        {failed.length > 0 && (
          <>
            <h2>Emails not sent</h2>
            <ul className="rows">
              {failed.map((e) => (
                <li key={e.id}>
                  <span>
                    {e.profiles?.display_name} · {QUESTS[e.quest_id].label}
                  </span>
                  <form action={retryEmailAction}>
                    <input type="hidden" name="entry_id" value={e.id} />
                    <button className="button" type="submit">
                      Retry
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Check activity">
        {selected && limits ? (
          <EntryForm
            key={selected.id}
            entryId={selected.id}
            athleteName={`${selected.profiles?.display_name ?? "Athlete"}${selected.status === "waiting" ? "" : ` · correcting a ${selected.status} result`}`}
            link={selected.link}
            questId={selected.quest_id}
            stravaId={selected.strava_activity_id ?? ""}
            activityAt={selected.activity_at ? utcToZonedLocal(new Date(selected.activity_at), PILOT_TIME_ZONE) : ""}
            value={selected.value === null ? null : Number(selected.value)}
            limits={limits}
            timeZone={PILOT_TIME_ZONE}
          />
        ) : (
          <p className="muted">Pick an activity from the queue.</p>
        )}
      </section>
    </div>
  );
}
