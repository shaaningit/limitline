"use client";

import { useActionState } from "react";
import { phoneLogin, type PhoneState } from "./actions";

const initial: PhoneState = { step: "number", message: "", phone: "" };

export function PhoneForm() {
  const [state, action, pending] = useActionState(phoneLogin, initial);

  if (state.step === "code") {
    return (
      <form action={action}>
        <p role="status">
          We texted a code to <strong className="num">{state.phone}</strong>.
        </p>
        <div className="field">
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            required
            autoFocus
            key={state.message}
          />
        </div>
        {state.message && (
          <p className="error" role="alert">
            {state.message}
          </p>
        )}
        <button className="button button-primary button-block" type="submit" name="step" value="code" disabled={pending}>
          {pending ? "Checking…" : "Log in"}
        </button>
        <input type="hidden" name="phone" value={state.phone} />
        <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1)" }}>
          <button className="button" style={{ flex: 1 }} type="submit" name="step" value="number" formNoValidate disabled={pending}>
            Send a new code
          </button>
          <button className="button" style={{ flex: 1 }} type="submit" name="step" value="change" formNoValidate disabled={pending}>
            Change number
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          autoFocus
          defaultValue={state.phone}
          key={state.phone + state.message}
          aria-describedby="phone-hint"
        />
        <p id="phone-hint" className="muted small">
          With your country code, like +44 7700 900123
        </p>
      </div>
      {state.message && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" name="step" value="number" disabled={pending}>
        {pending ? "Sending…" : "Text me a code"}
      </button>
    </form>
  );
}
