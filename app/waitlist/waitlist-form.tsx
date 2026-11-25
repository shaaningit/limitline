"use client";

import { useActionState, useState } from "react";
import { WAITLIST_SPORTS, type WaitlistRole } from "@/lib/waitlist";
import { joinWaitlist, type WaitlistState } from "./actions";

const initial: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm({ refCode }: { refCode: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  const v = state.values ?? {};
  const [role, setRole] = useState<WaitlistRole>(v.role === "brand" ? "brand" : "athlete");

  if (state.status === "joined") {
    return (
      <div className="waitlist-done" role="status">
        {state.position ? (
          <p className="waitlist-place">
            You&rsquo;re <span>#{state.position}</span>
          </p>
        ) : null}
        <p className="waitlist-done-title">You&rsquo;re on the list.</p>
        <p>
          {state.role === "brand"
            ? "Thanks. We'll be in touch about sponsoring a quest."
            : "We'll email you the day LIMITLINE opens. Tell your training partner."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} key={state.values ? JSON.stringify(state.values) : "new"}>
      <fieldset className="waitlist-role">
        <legend className="sr-only">I am</legend>
        {(["athlete", "brand"] as const).map((r) => (
          <label key={r} className={role === r ? "on" : ""}>
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
            {r === "athlete" ? "I'm an athlete" : "I'm a brand"}
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="wl-name">Name</label>
        <input id="wl-name" name="name" autoComplete="name" maxLength={80} defaultValue={v.name} />
      </div>
      <div className="field">
        <label htmlFor="wl-email">Email</label>
        <input id="wl-email" name="email" type="email" autoComplete="email" required defaultValue={v.email} />
      </div>
      {role === "brand" ? (
        <div className="field">
          <label htmlFor="wl-company">Brand name</label>
          <input id="wl-company" name="company" autoComplete="organization" required maxLength={80} defaultValue={v.company} />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="wl-sport">Your main sport</label>
          <select id="wl-sport" name="sport" defaultValue={v.sport ?? ""}>
            <option value="">Pick one (optional)</option>
            {WAITLIST_SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="wl-ig">
          Instagram <span className="waitlist-opt">optional</span>
        </label>
        <input id="wl-ig" name="instagram" autoComplete="off" placeholder="@yourhandle" defaultValue={v.instagram} />
      </div>

      {/* Hidden from people; bots fill it in. */}
      <div className="waitlist-trap" aria-hidden="true">
        <label htmlFor="wl-website">Website</label>
        <input id="wl-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="ref" value={refCode} />

      {state.status === "error" && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      <button className="button button-primary button-block" type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
