// "Connect with Strava" (Strava's orange, per their brand guidelines). A plain link, because
// it goes to a server route that redirects to Strava. `next` is where to come back to.
export function StravaConnectButton({ next, label = "Connect with Strava" }: { next: string; label?: string }) {
  return (
    <a className="button button-strava" href={`/strava/connect?next=${encodeURIComponent(next)}`}>
      <StravaMark /> {label}
    </a>
  );
}

function StravaMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="button-icon">
      <path d="M15.39 17.94l-2.09-4.12h-3.07L15.39 24l5.15-10.18h-3.08" opacity="0.7" />
      <path d="M10.12 0L3.24 13.82h4.06l2.82-5.57 2.8 5.57h4.03" />
    </svg>
  );
}

// Messages for ?strava=... after coming back from Strava.
export const STRAVA_RETURN: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Strava connected. Your activities are now checked in seconds." },
  denied: { ok: false, text: "Strava wasn't connected. You can try again any time." },
  scope: { ok: false, text: 'Strava was connected without "View data about your activities". Connect again and leave that box ticked.' },
  taken: { ok: false, text: "That Strava account is already connected to another LIMITLINE athlete." },
  expired: { ok: false, text: "That took too long. Tap Connect with Strava again." },
  failed: { ok: false, text: "Couldn't connect to Strava just now. Try again in a minute." },
  off: { ok: false, text: "Strava checking isn't switched on yet." },
};

export function StravaReturnMessage({ status }: { status: string | string[] | undefined }) {
  const msg = typeof status === "string" ? STRAVA_RETURN[status] : undefined;
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "result-card" : "error"} style={msg.ok ? { padding: "var(--space-2)" } : undefined}>
      {msg.ok && <span className="ok">✓ </span>}
      {msg.text}
    </p>
  );
}
