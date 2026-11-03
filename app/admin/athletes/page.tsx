import Link from "next/link";
import { getHistory } from "@/lib/data/admin";
import { requireFounder } from "@/lib/data/session";
import { formatPercent, formatValue } from "@/lib/format";
import { QUESTS, QUEST_IDS } from "@/lib/rules/config";
import { deleteSeed, saveSeed } from "../actions";

// Athletes, their seed limits (D21, with effort counts) and their results (to correct).
export default async function AthletesPage({ searchParams }: PageProps<"/admin/athletes">) {
  const { supabase } = await requireFounder();
  const { athlete, error } = await searchParams;
  const { data: athletes } = await supabase
    .from("profiles")
    .select("id, display_name, email, show_on_boards, signed_up_at")
    .eq("is_founder", false)
    .order("display_name");
  const selected = athletes?.find((a) => a.id === athlete) ?? null;
  const history = selected ? await getHistory(supabase, selected.id) : null;

  return (
    <div className="admin-panes">
      <section aria-labelledby="athletes">
        <h1 id="athletes">Athletes ({athletes?.length ?? 0})</h1>
        <ul className="rows">
          {(athletes ?? []).map((a) => (
            <li key={a.id} className={a.id === athlete ? "me" : undefined}>
              <Link href={`/admin/athletes?athlete=${a.id}`}>{a.display_name}</Link>
              <span className="muted small">{a.show_on_boards ? "" : "hidden from boards"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Athlete details">
        {!selected || !history ? (
          <p className="muted">Pick an athlete to set seed limits or correct results.</p>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{selected.display_name}</h2>
            <p className="muted small">
              {selected.email} · signed up {new Date(selected.signed_up_at).toLocaleDateString("en-GB")}
            </p>
            {typeof error === "string" && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <h3>Seed limits (best of the last 8 weeks)</h3>
            {QUEST_IDS.map((q) => {
              const seed = history.seeds.find((s) => s.questId === q);
              const measure = QUESTS[q].measure;
              const isAmount = measure !== "time"; // watts, or metres climbed
              const t = seed && !isAmount ? Math.round(seed.value) : 0;
              return (
                <form key={q} action={saveSeed} className="field" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "var(--space-2)" }}>
                  <input type="hidden" name="athlete_id" value={selected.id} />
                  <input type="hidden" name="quest" value={q} />
                  <p style={{ fontWeight: 600, margin: "0 0 var(--space-1)" }}>
                    {QUESTS[q].label}
                    {seed ? ` · now ${formatValue(q, seed.value)}, ${seed.effortCount} efforts` : " · no seed"}
                  </p>
                  <div className="time-inputs">
                    {isAmount ? (
                      <div style={{ gridColumn: "span 2" }}>
                        <label htmlFor={`${q}-amount`}>{measure === "power" ? "Watts" : "Metres climbed"}</label>
                        <input
                          id={`${q}-amount`}
                          name="amount"
                          type="number"
                          min={measure === "power" ? 50 : 100}
                          max={measure === "power" ? 2000 : 9000}
                          defaultValue={seed ? Math.round(seed.value) : ""}
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label htmlFor={`${q}-h`}>H</label>
                          <input id={`${q}-h`} name="h" type="number" min={0} max={9} defaultValue={Math.floor(t / 3600)} />
                        </div>
                        <div>
                          <label htmlFor={`${q}-m`}>Min</label>
                          <input id={`${q}-m`} name="m" type="number" min={0} max={59} defaultValue={seed ? Math.floor((t % 3600) / 60) : ""} required />
                        </div>
                        <div>
                          <label htmlFor={`${q}-s`}>Sec</label>
                          <input id={`${q}-s`} name="s" type="number" min={0} max={59} defaultValue={seed ? t % 60 : ""} required />
                        </div>
                      </>
                    )}
                    <div>
                      <label htmlFor={`${q}-efforts`}>Efforts seen</label>
                      <input id={`${q}-efforts`} name="effort_count" type="number" min={0} defaultValue={seed?.effortCount ?? ""} required />
                    </div>
                  </div>
                  <p style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1)" }}>
                    <button className="button button-primary" type="submit">
                      Save seed
                    </button>
                    {seed && (
                      <button className="button" type="submit" formAction={deleteSeed} formNoValidate>
                        Remove
                      </button>
                    )}
                  </p>
                </form>
              );
            })}

            <h3>Results</h3>
            <ul className="rows">
              {history.entries
                .filter((e) => e.status !== "waiting")
                .sort((a, b) => (b.activity_at ?? b.submitted_at).localeCompare(a.activity_at ?? a.submitted_at))
                .map((e) => (
                  <li key={e.id}>
                    <span>
                      {QUESTS[e.quest_id].label} ·{" "}
                      {e.status === "verified"
                        ? `${formatValue(e.quest_id, Number(e.value))}${e.percent === null ? "" : ` · ${formatPercent(Number(e.percent))}`} · ${e.embers} embers`
                        : `rejected (${e.reject_reason})`}
                    </span>
                    <Link className="button" href={`/admin?entry=${e.id}`}>
                      Correct
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
