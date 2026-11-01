"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LOGIN_OPTIONS } from "@/lib/auth-options";
import { signInWithGoogle } from "./actions";
import { LoginForm } from "./login-form";
import { PhoneForm } from "./phone-form";

type View = "choose" | "email" | "phone";

// Login choices under the logo: one tap for Google, a texted code for phone, a link for email.
export function LoginOptions({ expired, error }: { expired: boolean; error: string | null }) {
  const [view, setView] = useState<View>(expired ? "email" : "choose");

  if (view !== "choose") {
    return (
      <section aria-label={view === "email" ? "Log in with email" : "Log in with phone"}>
        {view === "email" ? <LoginForm expired={expired} /> : <PhoneForm />}
        <button className="button button-block button-quiet" type="button" onClick={() => setView("choose")}>
          ← Other ways to log in
        </button>
      </section>
    );
  }

  return (
    <div className="landing-actions">
      {error && (
        <p className="error" role="alert" style={{ textAlign: "center" }}>
          {error}
        </p>
      )}
      {LOGIN_OPTIONS.google && (
        <form action={signInWithGoogle}>
          <GoogleButton />
        </form>
      )}
      {LOGIN_OPTIONS.phone && (
        <button className="button button-block" type="button" onClick={() => setView("phone")}>
          <PhoneIcon /> Continue with phone
        </button>
      )}
      <button
        className={`button button-block${LOGIN_OPTIONS.google || LOGIN_OPTIONS.phone ? "" : " button-primary"}`}
        type="button"
        onClick={() => setView("email")}
      >
        <MailIcon /> Continue with email
      </button>
      <p className="muted small" style={{ textAlign: "center", margin: "var(--space-1) 0 0" }}>
        Invite-only pilot. Use the email the founder added.
      </p>
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-block button-google" type="submit" disabled={pending}>
      <GoogleIcon /> {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

// Google's "G", as its sign-in branding guidelines ask for.
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" className="button-icon">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="button-icon">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true" className="button-icon">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}
