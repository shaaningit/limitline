// LIMITLINE's icon set: chunky rounded strokes in the current text color, 24×24 grid.
// Decorative by default (aria-hidden); the control around an icon carries the label.

type IconProps = { size?: number; filled?: boolean; className?: string };

function Svg({ size = 24, className, children }: { size?: number; className?: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

// Quests: a flag on a peak.
export function QuestsIcon({ size, filled, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 20l6-9 4 5 3-4 5 8z" fill={filled ? "currentColor" : "none"} />
      <path d="M13 9V3l5 2-5 2" fill={filled ? "currentColor" : "none"} />
    </Svg>
  );
}

// Board: a trophy.
export function BoardIcon({ size, filled, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill={filled ? "currentColor" : "none"} />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 14v3M8 21h8M9 21l1-4h4l1 4" />
    </Svg>
  );
}

// Shop: a shopping bag.
export function ShopIcon({ size, filled, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 8h14l-1 12H6z" fill={filled ? "currentColor" : "none"} />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </Svg>
  );
}

// Profile with no photo: a head-and-shoulders silhouette in a circle (like Instagram).
export function AvatarSilhouette({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="var(--avatar-bg)" />
      <circle cx="14" cy="11" r="5" fill="var(--avatar-fg)" />
      <path d="M4.5 23.5a10.5 8 0 0 1 19 0A13.9 13.9 0 0 1 14 28a13.9 13.9 0 0 1-9.5-4.5z" fill="var(--avatar-fg)" />
    </svg>
  );
}

// Streak: a flame.
export function FlameIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 22c4 0 7-2.7 7-6.6 0-3.4-2.2-5.6-3.7-7.4-.4 1.7-1.3 2.8-2.5 3.3.3-3.3-1-6.5-3.8-8.3.2 3-1.6 5-3.2 7C4.6 11.5 5 13.2 5 15.4 5 19.3 8 22 12 22z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  );
}

// Embers: a glowing ember (a faceted gem).
export function EmberIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3l7 6-7 12-7-12z" fill="currentColor" stroke="none" />
      <path d="M5 9h14M12 3l-2.5 6L12 21l2.5-12z" stroke="var(--ember-facet)" strokeWidth="1.4" />
    </Svg>
  );
}

// Sports, for quest cards.
export function RunIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="15" cy="4.5" r="2" fill="currentColor" stroke="none" />
      <path d="M6 12l3-4 4 1 2 4 3 1M13 9l-2 5 3 3-1 4M11 14l-3 2-3-1" />
    </Svg>
  );
}

export function BikeIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l4-7h5l3 7M10 9l2 7h-6M14 6h3" />
    </Svg>
  );
}

export function SwimIcon({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="17" cy="6" r="2" fill="currentColor" stroke="none" />
      <path d="M4 12l5-3 3 2 3-2" />
      <path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M2 21c2 0 2-1.5 4-1.5S8 21 10 21s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
    </Svg>
  );
}

export function ChevronIcon({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M9 5l7 7-7 7" />
    </Svg>
  );
}
