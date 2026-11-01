"use client";

import { useActionState } from "react";
import { addPhone, type AddPhoneState } from "./actions";

export function PhoneLinkForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState(addPhone, { step: "number", message: "", phone: "" } as AddPhoneState);

  if (state.step === "done") {
    return (
      <p role="status">
        <span className="ok">✓</span> You can now log in with <span className="num">{state.phone}</span>.
      </p>
    );
  }

  if (state.step === "code") {
    return (
      <form action={action}>
        <p role="status">
          We texted a code to <strong className="num">{state.phone}</strong>.
        </p>
        <div className="field">
          <label htmlFor="phone-code">6-digit code</label>
          <input id="phone-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus key={state.message} />
        </div>
        {state.message && (
          <p className="error" role="alert">
            {state.message}
          </p>
        )}
        <input type="hidden" name="phone" value={state.phone} />
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          <button className="button button-primary" type="submit" name="step" value="code" disabled={pending}>
            {pending ? "Checking…" : "Confirm"}
          </button>
          <button className="button" type="submit" name="step" value="number" formNoValidate disabled={pending}>
            Send a new code
          </button>
          <button className="button" type="submit" name="step" value="change" formNoValidate disabled={pending}>
            Change number
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action}>
      {current && (
        <p>
          Logging in with <span className="num">{current}</span>. Add a new number below to change it.
        </p>
      )}
      <div className="field">
        <label htmlFor="link-phone">{current ? "New phone number" : "Phone number"}</label>
        <input
          id="link-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={state.phone}
          key={state.phone + state.message}
          aria-describedby="link-phone-hint"
        />
        <p id="link-phone-hint" className="muted small">
          With your country code, like +44 7700 900123. We&apos;ll text you a code.
        </p>
      </div>
      {state.message && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button" type="submit" name="step" value="number" disabled={pending}>
        {pending ? "Sending…" : "Text me a code"}
      </button>
    </form>
  );
}
