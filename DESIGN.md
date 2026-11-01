# LIMITLINE design system

The look of the app, as one set of values every screen uses. Written from the approved design decisions 9A, 10A and 13A, with the color amended on Nov 1 (black + neon green replaces the gold of 9A/11A), in `docs/designs/limitline-mvp.md`. Change a value here first, then in `app/globals.css`.

## Use scene

Athletes open LIMITLINE right after a run, ride or swim, on a phone held in one hand. The brand is black with neon green (founder's call, Nov 1): every screen is dark, and the neon is the one accent. Neon green on black is ~15:1 contrast, so it stays readable even in daylight.

## Logo

A neon green line breaking up through a dashed "limit line", next to the LIMITLINE wordmark (`components/logo.tsx`), always on black. It's a stand-in drawn in code until the founder's own logo file arrives; swap the SVG in that one file and every screen picks it up.

## Color

Dark only. One accent, neon green, used for the main button, the embers chip, badges, the +% hero number and the active tab. Text on a neon fill is always black.

| Token | Value | Use |
|---|---|---|
| `--ground` | `#000000` | Page background |
| `--surface` | `#0F120F` | Result card, input backgrounds |
| `--line` | `#2A302A` | Dividers and input borders |
| `--ink` | `#F2F5F0` | Body text and headings |
| `--ink-muted` | `#A3ABA0` | Secondary text (~8.6:1 on ground) |
| `--neon` | `#39FF14` | Accent: fills, the +% number, active tab, focus ring |
| `--on-neon` | `#000000` | Text on neon fills |
| `--neon-glow` | 12px neon at 45% | Soft glow on the logo and the +% number only |
| `--danger` | `#FF6B6B` | Errors and rejected results |
| `--link-visited` | `#B5F5A3` | Visited links |

The share image uses the same colors: black ground, neon wordmark and +%.

## Type

- **Display and numbers:** Barlow Condensed, 600 weight, with tabular (equal-width) digits so times and percentages line up. The share image uses a bundled `.ttf` of the same font.
- **Body and UI:** IBM Plex Sans, 400 and 600.
- Body text is at least 16px.

| Token | Size / line height | Font | Use |
|---|---|---|---|
| `--text-hero` | 56px / 1.0 | Barlow Condensed | +% beyond your limit (the anchor of any screen it's on) |
| `--text-h1` | 32px / 1.1 | Barlow Condensed | Page titles |
| `--text-h2` | 22px / 1.2 | Barlow Condensed | Section titles |
| `--text-body` | 16px / 1.5 | IBM Plex Sans | Everything else |
| `--text-small` | 14px / 1.4 | IBM Plex Sans | Labels and hints only, never paragraphs |

## Space, shape, motion

- Spacing on an 8px grid: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px, `--space-6` 48px. A heading has more space above it than below it.
- One corner radius: `--radius` 10px.
- No decorative cards or shadows. The result card is the only card, because it's the thing you act on.
- One motion moment: the result card counts up its +% and embers over about 0.6 s with an ease-out curve. It's switched off under `prefers-reduced-motion`. (First in the cut order if time runs short.)

## Browser details

- Focus ring: 3px `--neon` outline with a 2px offset, on every interactive element.
- Text selection: `--neon` background, `--on-neon` text.
- Links are underlined, with visited links in `--link-visited`.

## Layout and accessibility (12A, 13A)

- Athlete screens are phone-first from 360px wide: one column with the bottom bar (left to right: Quests, Board, Shop, Profile). Wider screens stay centered, capped at 480px.
- Admin is laptop-first: queue on the left, entry form on the right. Below 768px it becomes one column.
- Tap targets are at least 44×44px.
- Every field has a visible label above it. Placeholder text is never the only label.
- Pages use header, main and nav landmarks.
- Results are read to screen readers in full words, e.g. "3.4 percent beyond your limit, double embers".
