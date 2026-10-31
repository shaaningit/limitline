# LIMITLINE design system

The look of the app, as one set of values every screen uses. Written from the approved design decisions 9A, 10A, 11A and 13A in `docs/designs/limitline-mvp.md`. Change a value here first, then in `app/globals.css`.

## Use scene

Athletes open LIMITLINE right after a run, ride or swim: outdoors in daylight or poolside, on a phone held in one hand. So it's light mode by default (readable in sun), dark mode follows the phone setting, and every tap target is large.

## Color

One accent, used as a **fill only** (11A). Gold text or thin gold lines on white fail contrast (~2.2:1), so never use them.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | `#14161A` | `#F2F3F5` | Body text, headings, text on gold |
| `--ink-muted` | `#4A4F57` | `#B4B9C1` | Secondary text (≥ 4.5:1 on ground) |
| `--ground` | `#FFFFFF` | `#14161A` | Page background |
| `--surface` | `#F4F5F7` | `#1E2127` | Result card, sheets, input backgrounds |
| `--line` | `#D9DCE1` | `#3A3F47` | Dividers and input borders |
| `--ember` | `#E8A317` | `#E8A317` | Main button, embers chip, "beat limit" badge (fill) |
| `--on-ember` | `#14161A` | `#14161A` | Text on ember fills (~8.3:1) |
| `--danger` | `#B42318` | `#F97066` | Errors and rejected results |
| `--link-visited` | `#5B3E96` | `#C3A6F2` | Visited links |

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

- Focus ring: 3px `--ember` outline with a 2px offset, on every interactive element.
- Text selection: `--ember` background, `--on-ember` text.
- Links are underlined, with visited links in `--link-visited`.

## Layout and accessibility (12A, 13A)

- Athlete screens are phone-first from 360px wide: one column with the bottom bar (Quests, Board, Shop). Wider screens stay centered, capped at 480px.
- Admin is laptop-first: queue on the left, entry form on the right. Below 768px it becomes one column.
- Tap targets are at least 44×44px.
- Every field has a visible label above it. Placeholder text is never the only label.
- Pages use header, main and nav landmarks.
- Results are read to screen readers in full words, e.g. "3.4 percent beyond your limit, double embers".
