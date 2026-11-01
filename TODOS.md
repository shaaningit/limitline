# TODOS

## Activity verification

### Automatic checking through the Strava API: built Nov 1, finish before relying on it

Built: Connect with Strava (`/strava/connect`, `/strava/callback`), tokens readable only by the server (`strava_connections`), the check itself (`lib/strava/check.ts`, every rule unit-tested), the flow after pasting a link (`lib/strava/auto-check.ts`), and Strava notes with filled-in numbers in Admin. How it decides:
- rejects: someone else's activity, before sign-up, typed in by hand, wrong sport, indoor/virtual, e-bike, shorter than the quest, ride without a power meter
- approves in seconds: everything else, timed on Strava's fastest 5 km / 10 km, best 20-minute power (from the power stream, stops count as 0 W), or fastest 400 m / 1500 m (whole swim, or consecutive laps that add up exactly)
- sends to the founder with numbers filled in: more than 10% beyond the limit, beyond world-record pace (`PLAUSIBLE`), open-water-looking swims, no Strava best effort, laps that don't add up, or any Strava error

Still to do:
- **Live test.** This sandbox can't reach Strava, so the code has only been tested with sample activities shaped like Strava's documented API. Run the SETUP.md launch-check items with real activities before the pilot.
- **Strava approval past 1 athlete**, and Strava's written answer on the boards (SETUP.md step 4-5).
- **Strava's official button and logo.** Swap the hand-made "Connect with Strava" button and the "Powered by Strava" text for Strava's official image files (brand guidelines on developers.strava.com).
- **Strava webhook** for an athlete who removes LIMITLINE on Strava's side or deletes an activity, so the app forgets their tokens and data straight away (today it notices at the next refresh).
- **Admin: show which Strava account each athlete connected** (`strava_name`), so you can spot someone connecting a friend's faster account.
- **Short links** (`strava.app.link`): the app follows the link one step to find the activity number. Not verified live; if it doesn't work, those links still reach the founder as before.

**Effort:** S (remaining)
**Priority:** P1
**Depends on:** Strava API app + capacity approval

### Automate activity checking before growing past ~20 athletes (older plan, superseded by the item above)

**Context:** The earlier fallback was file upload (.fit/.gpx read in the browser), designed in `docs/designs/limitline-mvp.md`, Section 1 of the engineering review. Keep it as plan B if Strava says no.

## Brand

### Brand quests and content challenges (founder idea, Nov 1, "we'll see this later")

**What:**
- **Sponsored quests:** a normal quest with a brand's name and a prize, e.g. "Run 10 km this week, best % beyond their limit wins a pack".
- **Content challenges in the Shop:** a brand posts a brief, a deadline and a prize (e.g. "Make content for <brand>"); athletes submit a link to their post; the brand picks a winner, who gets an affiliation or prize.

**Why:** More brands means more shop items and a reason for brands to pay, which is the business model (more users, more redemptions of brand items).

**Before building:** a real brand's written yes (never show a brand's name without it); terms for who owns submitted content; "#ad" disclosure on posts.

**Priority:** P2, after the pilot's first brand conversation

### Tone down the volt (founder: "sort of too bright, we can work on that later")

**What:** Try a slightly softer volt than `#CEFF00` on matte black and pick one with the founder. Change DESIGN.md first, then `app/globals.css`, `app/icon.svg` and the share card.

**Priority:** P3

### Swap in the founder's logo

**What:** Replace the code-drawn stand-in in `components/logo.tsx` and `app/icon.svg` with the founder's logo file (volt on matte black), and use it on the share card.

**Priority:** P1, as soon as the file arrives

## Completed
