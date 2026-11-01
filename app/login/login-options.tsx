"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";

// Login choices under the logo. Email is the only one switched on for the pilot;
// more providers (Google, Apple) slot in here as extra buttons.
export function LoginOptions({ expired }: { expired: boolean }) {
  const [showEmail, setShowEmail] = useState(expired);

  if (showEmail) {
    return (
      <section aria-label="Log in with email">
        <LoginForm expired={expired} />
        <button className="button button-block" type="button" onClick={() => setShowEmail(false)} style={{ marginTop: "var(--space-1)" }}>
          Back
        </button>
      </section>
    );
  }

  return (
    <div className="landing-actions">
      <button className="button button-primary button-block" type="button" onClick={() => setShowEmail(true)}>
        Continue with email
      </button>
      <p className="muted small" style={{ textAlign: "center", margin: "var(--space-1) 0 0" }}>
        Invite-only pilot. Use the email you signed up with.
      </p>
    </div>
  );
}
