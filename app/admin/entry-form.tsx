"use client";

import { useActionState, useState } from "react";
import { QUESTS, QUEST_IDS, REJECT_REASONS, type QuestId } from "@/lib/rules/config";
import { saveEntry, type EntryFormState } from "./actions";

export interface EntryFormProps {
  entryId: string;
  athleteName: string;
  link: string;
  questId: QuestId;
  stravaId: string;
  activityAt: string; // datetime-local in the pilot time zone, or ""
  value: number | null;
  limits: Record<QuestId, string>; // current limit per quest, formatted
  timeZone: string;
}

function splitTime(value: number | null) {
  if (value === null) return { h: "", m: "", s: "" };
  const t = Math.round(value);
  return { h: String(Math.floor(t / 3600)), m: String(Math.floor((t % 3600) / 60)), s: String(t % 60) };
}

// Structured entry (14A): h/mm/ss or watts by quest, current limit beside the input,
// activity date/time (re-review #1), preview + confirm (D17), reject with reasons (re-review #2).
export function EntryForm(props: EntryFormProps) {
  const [state, action, pending] = useActionState(saveEntry, { status: "idle", message: "" } as EntryFormState);
  const [questId, setQuestId] = useState<QuestId>(props.questId);
  const isPower = QUESTS[questId].measure === "power";
  const time = splitTime(isPower ? null : props.value);
  // React clears a form after its action runs; show what was submitted again instead.
  const v = state.values;
  const initial = {
    strava_id: v?.strava_id ?? props.stravaId,
    activity_at: v?.activity_at ?? props.activityAt,
    h: v?.h ?? (time.h || "0"),
    m: v?.m ?? time.m,
    s: v?.s ?? time.s,
    watts: v?.watts ?? (isPower && props.value !== null ? String(Math.round(props.value)) : ""),
  };
  // A new key remounts the inputs so their defaults pick up the echoed values.
  const formKey = JSON.stringify(v ?? {}) + state.status;

  if (state.status === "saved") {
    return (
      <p role="status">
        <strong>{state.message}</strong> Pick the next activity from the queue.
      </p>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{props.athleteName}</h2>
      <p>
        <a href={props.link} target="_blank" rel="noreferrer noopener">
          Open the activity on Strava ↗
        </a>
      </p>

      <form action={action} key={formKey}>
        <input type="hidden" name="entry_id" value={props.entryId} />
        <input type="hidden" name="intent" value="verify" />
        {state.status === "needs_confirm" && <input type="hidden" name="confirm_token" value={state.confirmToken} />}

        <div className="field">
          <label htmlFor="quest">Quest</label>
          <select id="quest" name="quest" value={questId} onChange={(e) => setQuestId(e.target.value as QuestId)}>
            {QUEST_IDS.map((id) => (
              <option key={id} value={id}>
                {QUESTS[id].label}
              </option>
            ))}
          </select>
          <p className="muted small">Current limit: {props.limits[questId]}</p>
        </div>

        <div className="field">
          <label htmlFor="strava_id">Strava activity number</label>
          <input id="strava_id" name="strava_id" inputMode="numeric" defaultValue={initial.strava_id} required />
          <p className="muted small">The number in strava.com/activities/…, found by opening short links.</p>
        </div>

        <div className="field">
          <label htmlFor="activity_at">Activity date and time ({props.timeZone})</label>
          <input id="activity_at" name="activity_at" type="datetime-local" defaultValue={initial.activity_at} required />
        </div>

        {isPower ? (
          <div className="field">
            <label htmlFor="watts">Best 20-minute power (watts)</label>
            <input id="watts" name="watts" type="number" inputMode="numeric" min={50} max={2000} step={1} defaultValue={initial.watts} required />
          </div>
        ) : (
          <fieldset className="field" style={{ border: 0, padding: 0, margin: "0 0 var(--space-2)" }}>
            <legend style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>
              {QUESTS[questId].label} time
            </legend>
            <div className="time-inputs">
              <div>
                <label htmlFor="h">Hours</label>
                <input id="h" name="h" type="number" inputMode="numeric" min={0} max={9} defaultValue={initial.h} />
              </div>
              <div>
                <label htmlFor="m">Minutes</label>
                <input id="m" name="m" type="number" inputMode="numeric" min={0} max={59} defaultValue={initial.m} required />
              </div>
              <div>
                <label htmlFor="s">Seconds</label>
                <input id="s" name="s" type="number" inputMode="numeric" min={0} max={59} defaultValue={initial.s} required />
              </div>
            </div>
          </fieldset>
        )}

        {state.status === "needs_confirm" && (
          <div className="result-card" role="alert">
            <p>{state.message}</p>
            <p className="num">{state.preview}</p>
          </div>
        )}
        {state.status === "error" && (
          <p className="error" role="alert">
            {state.message}
          </p>
        )}

        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : state.status === "needs_confirm" ? "Yes, this is right" : "Save result"}
        </button>
      </form>

      <form action={action} style={{ marginTop: "var(--space-4)" }}>
        <input type="hidden" name="entry_id" value={props.entryId} />
        <input type="hidden" name="intent" value="reject" />
        <div className="field">
          <label htmlFor="reason">Reject because</label>
          <select id="reason" name="reason" defaultValue="cant_view">
            {Object.entries(REJECT_REASONS).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <button className="button" type="submit" disabled={pending}>
          Reject
        </button>
      </form>
    </div>
  );
}
