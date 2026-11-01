"use client";

import { useActionState } from "react";
import type { QuestId } from "@/lib/rules/config";
import { submitLink, type LinkState } from "./actions";

const initial: LinkState = { message: "", link: "" };

export function LinkForm({ questId }: { questId: QuestId }) {
  const [state, action, pending] = useActionState(submitLink.bind(null, questId), initial);
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
      {state.message && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? "Checking link…" : "Submit for check"}
      </button>
    </form>
  );
}
