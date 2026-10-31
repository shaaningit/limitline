"use client";

import { useActionState } from "react";
import { QUESTS, QUEST_IDS } from "@/lib/rules/config";
import { submitEntry, type SubmitState } from "./actions";

const initial: SubmitState = { message: "", link: "" };

export function SubmitForm() {
  const [state, action, pending] = useActionState(submitEntry, initial);
  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="link">Strava activity link</label>
        <input
          id="link"
          name="link"
          type="url"
          inputMode="url"
          required
          defaultValue={state.link}
          key={state.link}
          aria-describedby="link-hint"
        />
        <p id="link-hint" className="muted small">
          In the Strava app: Share → Copy link
        </p>
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: "0 0 var(--space-2)" }}>
        <legend style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>Which quest was it?</legend>
        <ul className="rows">
          {QUEST_IDS.map((id) => (
            <li key={id}>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", margin: 0, flex: 1 }}>
                <input
                  type="radio"
                  name="quest"
                  value={id}
                  required
                  defaultChecked={state.quest === id}
                  key={`${id}-${state.quest}`}
                  style={{ width: 22, minHeight: 22 }}
                />
                {QUESTS[id].label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {state.message && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? "Checking link…" : "Submit"}
      </button>
    </form>
  );
}
