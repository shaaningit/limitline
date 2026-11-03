# LIMITLINE design system

The look of the app, as one set of values every screen uses. Written from the approved design decisions 9A, 10A and 13A, with the color amended on Nov 1 (volt on matte black replaces the gold of 9A/11A), in `docs/designs/limitline-mvp.md`. Change a value here first, then in `app/globals.css`.

## Use scene

Athletes open LIMITLINE right after a run, ride or swim, on a phone held in one hand. The brand is **volt on matte black** (founder's call, locked Nov 1): every screen is dark and flat, and volt is the one accent. Volt on matte black is ~16:1 contrast, so it stays readable even in daylight.

## Logo

A volt line breaking up through a dashed "limit line", next to the LIMITLINE wordmark (`components/logo.tsx`), always on matte black. It's a stand-in drawn in code until the founder's own logo file arrives; swap the SVG in that one file and every screen picks it up.

## Color

Dark only, matte: no glows, gloss or gradients. One accent, volt, used for the main button, the embers chip, badges, the +% hero number and the active tab. Text on a volt fill is always matte black.

| Token | Value | Use |
|---|---|---|
| `--ground` | `#121212` | Page background (matte black) |
| `--surface` | `#1C1C1C` | Result card, input backgrounds |
| `--line` | `#2E2E2E` | Dividers and input borders |
| `--ink` | `#F2F2EE` | Body text and headings |
| `--ink-muted` | `#A6A6A0` | Secondary text (~7.6:1 on ground) |
| `--volt` | `#CEFF00` | Accent: fills, the +% number, active tab, focus ring |
| `--on-volt` | `#121212` | Text on volt fills |
| `--danger` | `#FF6B6B` | Errors and rejected results |
| `--link-visited` | `#E2FF80` | Visited links |

The share image uses the same colors: matte black ground, volt wordmark and +%.

## Feel (founder, Nov 1: "give it a Duolingo sort of feel")

- **Chunky and pressable.** Buttons and quest cards have a solid bottom edge (`--line-strong`, or `--volt-deep` under volt) and sink 3px when pressed. Corners are round (`--radius` 16px, cards 20px). Button labels are bold capitals.
- **Game stats on top.** My quests opens with a weekly streak flame (the one warm color, `#FF9F1A`) and the embers counter. A missed-week nudge appears when the streak needs an activity before Sunday.
- **Progress you can see.** Each quest card shows a bar toward double embers (4 efforts), then "2× unlocked".
- **Icons over words.** The bottom bar is icons only: Quests (flag on a peak), Board (trophy), Shop (bag), and Profile as the athlete's photo, or a silhouette when there's none, like Instagram. Names stay available to screen readers.
- **The opening graphic.** The landing opens on "the march of greatness" (`lib/intro/evolution.ts`): one figure evolves as it walks, from all fours to upright to runner, leaving grey silhouettes of its earlier selves labelled 6M years ago, 3M, 2M and Today. Then it breaks through the volt "YOUR LIMIT" line, which turns solid with a burst of sparks, and stands with arms raised: "YOU". It runs about 6.6 s, tap to skip or replay, and with reduced motion it shows the finished lineup straight away. Pictogram style: round-capped strokes, film grain and a vignette.
- **One celebration.** A new +% result pops in (0.45 s, slight overshoot). Off under reduced motion.

## Type

- **Display and numbers:** Barlow Condensed, 600 weight, with tabular (equal-width) digits so times and percentages line up. The share image uses a bundled `.ttf` of the same font.
- **Body and UI:** Nunito, 500 / 700 / 800: rounded and friendly, for the Duolingo-style feel (replaced IBM Plex Sans on Nov 1).
- Body text is at least 16px.

| Token | Size / line height | Font | Use |
|---|---|---|---|
| `--text-hero` | 56px / 1.0 | Barlow Condensed | +% beyond your limit (the anchor of any screen it's on) |
| `--text-h1` | 32px / 1.1 | Barlow Condensed | Page titles |
| `--text-h2` | 22px / 1.2 | Barlow Condensed | Section titles |
| `--text-body` | 16px / 1.5 | Nunito | Everything else |
| `--text-small` | 14px / 1.4 | Nunito | Labels and hints only, never paragraphs |

## Space, shape, motion

- Spacing on an 8px grid: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px, `--space-6` 48px. A heading has more space above it than below it.
- Corner radius: `--radius` 16px; cards 20px; pills fully round.
- Cards are for things you tap or act on: quest cards and the result card. Plain lists stay as rows. No soft drop shadows; the only "shadow" is the solid pressable edge.
- One motion moment: the result card counts up its +% and embers over about 0.6 s with an ease-out curve. It's switched off under `prefers-reduced-motion`. (First in the cut order if time runs short.)

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
