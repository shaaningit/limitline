# LIMITLINE design system

The look of the app, as one set of values every screen uses. Written from the approved design decisions 9A, 10A and 13A, with the color amended on Nov 1 (volt on matte black replaces the gold of 9A/11A), in `docs/designs/limitline-mvp.md`. Change a value here first, then in `app/globals.css`.

## Use scene

Athletes open LIMITLINE right after a run, ride or swim, on a phone held in one hand. The brand is **volt on matte black** (founder's call, locked Nov 1): every screen is dark and flat, and volt is the one accent. Volt on matte black is ~16:1 contrast, so it stays readable even in daylight.

## Logo

**Break-out** (Nov 4): a flat grey line, and a volt blade breaking up out of it, so crossing the line is what lights you up. It sits beside the wordmark LIMITLINE, set in Archivo Expanded (125% width) ExtraBold with 0.04em tracking, in off-white. The mark lives in `components/logo.tsx` and `app/icon.svg` (the app icon: the mark on matte black). If a final logo file arrives, swap it in those two places.

## Color

Dark only, matte. Glow is reserved for volt: the main button, the progress line, and the athlete in the opening graphic. One accent, volt, used for the main button, the embers chip, badges, the +% hero number and the active tab. Text on a volt fill is always matte black.

| Token | Value | Use |
|---|---|---|
| `--ground` | `#0C0C0C` | Page background (matte black) |
| `--surface` | `#141414` | Inputs; cards use a #161616 to #111111 gradient |
| `--line` / `--line-strong` | 8% / 14% white | Hairline dividers and borders |
| `--ink` | `#F4F4F0` | Body text, headings, the wordmark |
| `--ink-muted` | `#9A9A94` | Secondary text (~7:1 on ground) |
| `--volt` | `#CEFF00` | Accent: fills, the +% number, active tab, focus ring |
| `--on-volt` | `#121212` | Text on volt fills |
| `--danger` | `#FF6B6B` | Errors and rejected results |
| `--link-visited` | `#E2FF80` | Visited links |

The share image uses the same colors: matte black ground, volt wordmark and +%.

## Feel (founder, Nov 4: "premium, not childish")

Premium sports product, not a kids' game; it keeps the game mechanics (streak, embers, progress, ranks) but dresses them quietly.
- **Buttons:** slim (52px), 14px corners, sentence case, no bottom edge. Volt for the one main action (an inner highlight and a soft volt glow); glass (4.5% white) with a hairline border for the rest; white for Google. Pressing scales to 98.5%. No capitals, no bounce.
- **Surfaces:** hairline borders (8% white), a faint top-to-bottom gradient on cards, no drop shadows. The sport tile is a tinted volt square with a volt hairline, not a solid volt circle.
- **Stats:** streak flame and embers as glass pills. Progress is a 4px volt line with a faint glow.
- **Bottom bar:** glass, icons only, the active tab marked by a small volt dot. Profile is the athlete's photo or a silhouette.
- **Board:** rank tiles; top 3 tinted volt.
- **The opening graphic:** "the march of greatness" (`lib/intro/evolution.ts`). One figure evolves as it walks, from all fours to upright to runner, leaving grey silhouettes of its earlier selves (6M YRS AGO, 3M, 2M, TODAY). It breaks through the volt "YOUR LIMIT" line in a burst of sparks and stands with arms raised: YOU. A soft reflection on the floor, film grain and a vignette give it a cinematic finish. About 6.6 s; tap to skip or replay; reduced motion shows the finished lineup.
- **Opening screen:** the graphic with the logo over it, then a small "RUN · RIDE · SWIM · HIKE" line, the headline "Cross your limit. / Get rewarded." (volt second line), one sentence, and the way in: Google first, then Phone and Email side by side.
- **One celebration:** a new +% result scales in (0.5 s). Off under reduced motion.

## Type

- **Display, numbers and wordmark:** Archivo (variable width). Headings at 112% width Bold; big numbers ExtraBold with tabular digits; the wordmark at 125% width. Wide and athletic without shouting.
- **Text and buttons:** Manrope, 500 to 800: clean and modern (replaced Nunito on Nov 4, which read as childish).
- **Labels:** 11px, 700, uppercase, 0.14 to 0.18em tracking, muted.
- Body text is at least 15-16px.

| Token | Size | Use |
|---|---|---|
| `--text-hero` | 56px | +% beyond your limit |
| `--text-h1` | 30px | Page titles |
| `--text-h2` | 18px | Section titles |
| `--text-body` | 16px | Everything else |
| `--text-small` | 14px | Hints and secondary lines |

## Space, shape, motion

- Spacing on an 8px grid: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px, `--space-6` 48px. A heading has more space above it than below it.
- Corners: `--radius` 14px for buttons and inputs, 18-20px for cards, fully round for pills.
- Motion is quiet: 0.12-0.3 s ease, small scale on press, one celebration (the +% result) and the opening graphic. Everything is off under `prefers-reduced-motion`.

## Browser details

- Focus ring: 3px `--volt` outline with a 2px offset, on every interactive element.
- Text selection: `--volt` background, `--on-volt` text.
- Links are underlined, with visited links in `--link-visited`.

## Layout and accessibility (12A, 13A)

- Athlete screens are phone-first from 360px wide: one column with the icon-only bottom bar (left to right: Quests, Board, Shop, Profile photo). Wider screens stay centered, capped at 480px.
- Admin is laptop-first: queue on the left, entry form on the right. Below 768px it becomes one column.
- Tap targets are at least 44×44px.
- Every field has a visible label above it. Placeholder text is never the only label.
- Pages use header, main and nav landmarks.
- Results are read to screen readers in full words, e.g. "3.4 percent beyond your limit, double embers".
