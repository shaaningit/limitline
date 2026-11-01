"use client";

import { useActionState } from "react";
import { sendLoginLink, type LoginState } from "./actions";

const initial: LoginState = { status: "idle", message: "" };

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState(sendLoginLink, initial);

  if (state.status === "sent") {
    return (
      <p role="status">
        <strong>Check your email.</strong> Tap the link in it to log in.
      </p>
    );
  }

  return (
    <form action={action}>
      {expired && state.status === "idle" && (
        <p className="error" role="alert">
          That link expired. Enter your email for a new one.
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          defaultValue={state.email}
          key={state.email}
        />
      </div>
      {state.status === "error" && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a login link"}
      </button>
    </form>
  );
}
