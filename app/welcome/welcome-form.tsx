"use client";

import { useActionState } from "react";
import { createProfile, type WelcomeState } from "./actions";

export function WelcomeForm() {
  const [state, action, pending] = useActionState(createProfile, { message: "" } as WelcomeState);
  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="first">First name</label>
        <input id="first" name="first" autoComplete="given-name" required maxLength={30} defaultValue={state.first} key={`f-${state.first}`} />
      </div>
      <div className="field">
        <label htmlFor="initial">First letter of your last name</label>
        <input id="initial" name="initial" required maxLength={1} defaultValue={state.initial} key={`i-${state.initial}`} />
      </div>
      <p className="muted small">Boards show you as &quot;First L.&quot;. You can hide from boards any time.</p>
      {state.message && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Start"}
      </button>
    </form>
  );
}
