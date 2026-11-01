# TODOS

## Activity verification

### Automatic checking through the Strava API (founder chose the Strava route, Nov 1)

**What:** Let the app do the founder's checks itself. Each athlete taps "Connect Strava" once. When they paste a link, the server asks Strava's official API for that activity and checks, with exact numbers:
- it belongs to them, and was recorded after they signed up
- the sport matches the quest, it's outdoor (`trainer` false) and not typed in by hand (`manual` false)
- the distance is at least the quest distance; runs use Strava's own fastest 5 km / 10 km (`best_efforts`), so a 10 km run on the 5 km quest is timed on its fastest 5 km and a 5 km run on the 10 km quest is rejected
- bike: a real power meter (`device_watts`) and the best 20-minute power from the watts stream
- swims: pool swim, distance, and the fastest 400 m / 1500 m from its laps (falls back to the founder if the watch didn't record laps)

Results that pass are approved in seconds. Results more than 10% beyond the limit, a first result, and anything unclear still go to the founder (the existing double-check, D17).

**Why:** Founder checking doesn't scale past ~20 athletes (D13), and the founder wants approvals to be fast. This is plain code reading Strava's numbers, not AI guessing, so it can be exact and tested.

**Not this:** having a bot open the public Strava page (scraping is against Strava's terms), or AI reading screenshots (screenshots can be faked; the founder asked for a check we can vouch for).

**Before building, the founder needs to:**
- create a free Strava API app (strava.com/settings/api) and apply to Strava to go past its 1-athlete limit for new apps
- ask Strava whether the weekly boards (showing % beyond limit to other athletes) are allowed; since Nov 2024 Strava's terms say an app may show a user's Strava data only to that user. If not, boards would need a change
- add a server-only Supabase secret key (or an Edge Function), because athletes must not be able to approve their own entries

**Effort:** M-L
**Priority:** P1 (founder's next pick after login)
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
