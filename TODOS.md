# TODOS

## Activity verification

### Automate activity checking before growing past ~20 athletes

**What:** Replace founder hand-checking of Strava links with an automatic way to verify activities.

**Why:** In v1 the founder opens every Strava link and types in the numbers (eng review D13). At 10 athletes that's roughly 50-100 entries a week [estimated], and it stops working past about 20 athletes.

**Context:** The most likely path is file upload with an in-browser reader: `@garmin/fitsdk` for .fit files, `DOMParser` for .gpx, `DecompressionStream` for .gz. Each file gets a fingerprint so an activity counts once, and only numbers are sent to the server, whose rules decide (D9). That design is in `docs/designs/limitline-mvp.md`, Section 1 of the engineering review. A Strava API connection is the other option, but since Nov 2024 Strava's rules only allow showing a user's data to that same user, so it can't feed the shared boards. Start this only if the pilot passes its success metric (D20: at least 5 of 10 athletes active in both week 3 and week 4).
Pros: unblocks growth after a successful pilot and reuses a reviewed design. Cons: 1-2 weeks of build [estimated], and uploading files is more work for athletes than pasting a link.

**Effort:** L
**Priority:** P2
**Depends on:** Pilot result (D20), due Dec 13-20, 2026

## Completed
