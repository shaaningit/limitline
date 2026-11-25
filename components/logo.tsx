// The LIMITLINE logo (Nov 4): "break-out", a flat line and a volt blade breaking up out of it,
// beside a wide wordmark. The same story as the opening graphic: you cross the line, you light up.
// Swap the mark here (and in app/icon.svg) if a final logo file replaces it.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 48 32" aria-hidden="true">
      {/* the limit line */}
      <path d="M0 26H21.2L19.5 29.5H0Z" fill="#f4f4f0" fillOpacity="0.42" />
      {/* breaking out of it */}
      <path d="M22.8 29.5H30L46 1H38.8Z" fill="#ceff00" />
    </svg>
  );
}

// `stacked` puts a large mark above the wordmark; otherwise they sit side by side.
export function Logo({ size = 32, wordmark = true, stacked = false }: { size?: number; wordmark?: boolean; stacked?: boolean }) {
  return (
    <span className={stacked ? "logo logo-stacked" : "logo"} role="img" aria-label="LIMITLINE">
      <LogoMark size={stacked ? size * 2 : size} />
      {wordmark && (
        <span className="logo-word" style={{ fontSize: size * 0.85 }} aria-hidden="true">
          LIMITLINE
        </span>
      )}
    </span>
  );
}

// The "Sprint" mark (Nov 20, the founder's pick): an italic L with speed slits.
// Used on the public waitlist page first; the rest of the app still shows the break-out mark.
export function SprintMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <polygon fill="#ceff00" points="78,30 114,30 90,134 156,134 148,170 42,170" />
      <g fill="var(--ground)">
        <rect x="40" y="58" width="74" height="8" />
        <rect x="34" y="80" width="74" height="8" />
        <rect x="28" y="102" width="74" height="8" />
      </g>
      <g fill="#ceff00">
        <rect x="20" y="58" width="22" height="8" rx="4" />
        <rect x="10" y="80" width="26" height="8" rx="4" />
        <rect x="4" y="102" width="22" height="8" rx="4" />
      </g>
    </svg>
  );
}

export function SprintLogo({ size = 32 }: { size?: number }) {
  return (
    <span className="logo" role="img" aria-label="LIMITLINE">
      <SprintMark size={size * 1.4} />
      <span className="logo-word" style={{ fontSize: size * 0.85 }} aria-hidden="true">
        LIMITLINE
      </span>
    </span>
  );
}
