# LIMITLINE mini app (demo)

`limitline-mini.html` is a single-page, working mini version of the athlete app for showing people the idea before the real app is online. It runs entirely in the browser with sample data: no database, no real Strava or logins.

It opens on the "march of greatness" graphic (the same code as `lib/intro/evolution.ts`) and follows the real app's rules (`lib/rules`, `lib/strava/check.ts`) across all 14 run, ride, swim and hike quests: quest first then link, longer counts at the quest distance, shorter is rejected, jumps over 10% go to the founder, double embers after 4 efforts, weekly streak, boards ranked by %, shop redeeming. It also shows what's planned next: Instagram content quests and sample brand sponsors (HALDO and MOXA TRAIL are made up, marked "Sample sponsor"). Progress is saved in the viewer's browser; Profile → Reset demo starts over.

Open it by double-clicking the file. When the rules change in the app, update the copy of them near the top of the file's script.
