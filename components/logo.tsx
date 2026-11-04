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
