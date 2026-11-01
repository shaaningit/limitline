// LIMITLINE logo: a volt line breaking up through the limit line, plus the wordmark.
// Stand-in drawn in code until the founder's logo file arrives; swap the <svg> here
// (and app/icon.svg) and every screen, the app icon and the share card follow.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size * 1.5}
      height={size}
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* the limit line */}
      <path d="M2 19H46" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.6" />
      {/* the effort breaking through it */}
      <path d="M3 28L15 23L22 25L32 12L44 4" strokeWidth="3.5" />
      <path d="M37 4H44V11" strokeWidth="3.5" />
    </svg>
  );
}

// `stacked` puts a large mark above the wordmark (landing screen); otherwise they sit side by side.
export function Logo({ size = 32, wordmark = true, stacked = false }: { size?: number; wordmark?: boolean; stacked?: boolean }) {
  return (
    <span className={stacked ? "logo logo-stacked" : "logo"} role="img" aria-label="LIMITLINE">
      <LogoMark size={stacked ? size * 2 : size} />
      {wordmark && (
        <span className="logo-word" style={{ fontSize: size }} aria-hidden="true">
          LIMITLINE
        </span>
      )}
    </span>
  );
}
