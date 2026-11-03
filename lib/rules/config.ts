// The single source of truth for quests and embers. Rules, pages, emails and
// the "How embers work" sheet all read from here (eng review: no hand-synced lists).

export type QuestId =
  | "run1mile"
  | "run5k"
  | "run10k"
  | "runHalf"
  | "run5kTrail"
  | "bike20"
  | "bike40k"
  | "bike100k"
  | "swim400"
  | "swim1500"
  | "swim3800"
  | "hike10k"
  | "hikeUp1000"
  | "hikeUp2000";
export type Sport = "run" | "bike" | "swim" | "hike";
// time: lower is better. power (watts) and elevation (metres climbed): higher is better.
export type Measure = "time" | "power" | "elevation";

export interface Quest {
  id: QuestId;
  sport: Sport;
  label: string;
  measure: Measure;
  // Time quests: the distance covered. Power quests: the effort length. Climb quests: the minimum climb.
  distanceMeters?: number;
  durationSeconds?: number;
  minClimbMeters?: number;
  trail?: boolean; // run quests that need a Strava "Trail Run"
}

// Listed in the order the app shows them, grouped by sport (founder, Nov 3: "way more quests, hiking too").
export const QUESTS: Record<QuestId, Quest> = {
  run1mile: { id: "run1mile", sport: "run", label: "Run 1 mile", measure: "time", distanceMeters: 1609 },
  run5k: { id: "run5k", sport: "run", label: "Run 5 km", measure: "time", distanceMeters: 5000 },
  run10k: { id: "run10k", sport: "run", label: "Run 10 km", measure: "time", distanceMeters: 10000 },
  runHalf: { id: "runHalf", sport: "run", label: "Run a half marathon", measure: "time", distanceMeters: 21097 },
  run5kTrail: { id: "run5kTrail", sport: "run", label: "Trail run 5 km", measure: "time", distanceMeters: 5000, trail: true },
  bike20: { id: "bike20", sport: "bike", label: "Bike 20-min power", measure: "power", durationSeconds: 1200 },
  bike40k: { id: "bike40k", sport: "bike", label: "Ride 40 km", measure: "time", distanceMeters: 40000 },
  bike100k: { id: "bike100k", sport: "bike", label: "Ride 100 km", measure: "time", distanceMeters: 100000 },
  swim400: { id: "swim400", sport: "swim", label: "Swim 400 m", measure: "time", distanceMeters: 400 },
  swim1500: { id: "swim1500", sport: "swim", label: "Swim 1500 m", measure: "time", distanceMeters: 1500 },
  swim3800: { id: "swim3800", sport: "swim", label: "Swim 3.8 km", measure: "time", distanceMeters: 3800 },
  hike10k: { id: "hike10k", sport: "hike", label: "Hike 10 km", measure: "time", distanceMeters: 10000 },
  hikeUp1000: { id: "hikeUp1000", sport: "hike", label: "Climb 1000 m", measure: "elevation", minClimbMeters: 1000 },
  hikeUp2000: { id: "hikeUp2000", sport: "hike", label: "Climb 2000 m", measure: "elevation", minClimbMeters: 2000 },
};

export const SPORT_LABELS: Record<Sport, string> = { run: "Run", bike: "Ride", swim: "Swim", hike: "Hike" };

export const QUEST_IDS = Object.keys(QUESTS) as QuestId[];

// One board per sport (D16): every run quest shares Run, every swim quest shares Swim, and so on.
export const BOARDS: Sport[] = ["run", "bike", "swim", "hike"];

export const EMBERS = {
  // Founder sets the real amount before Nov 16 (Open Question 7); 10 is a placeholder.
  base: 10,
  // Beating your limit doubles the base (D12).
  beatMultiplier: 2,
  // Doubling unlocks once a quest type has this many verified efforts (approved minimum-history rule).
  minEffortsToDouble: 4,
};

// Admin double-check: entries this far beyond the limit need a second click (D17).
export const CONFIRM_ABOVE_PERCENT = 10;

// Sane ranges for admin input (eng re-review #8). Values outside are rejected as typos.
export const INPUT_LIMITS = {
  maxHours: 9,
  minWatts: 50,
  maxWatts: 2000,
  minClimb: 100,
  maxClimb: 9000,
};

// One pilot time zone for weekly boards (D16). Set PILOT_TIME_ZONE to the founder's zone.
export const PILOT_TIME_ZONE = process.env.PILOT_TIME_ZONE ?? "UTC";

// Reasons the founder can reject an activity, matched to the status messages (design 4A).
export const REJECT_REASONS = {
  cant_view: "Can't view: set activity to Followers",
  before_signup: "Before your sign-up, doesn't count",
  needs_power: "Bike quest needs power data",
  not_outdoor: "Outdoor activities only",
  not_own: "This activity isn't yours",
  not_completed: "Quest distance or time not completed",
  wrong_sport: "Wrong sport for this quest",
  manual_entry: "Typed-in activities don't count, record it with a watch or phone",
  not_trail: "Trail quests need a trail run",
} as const;

export type RejectReason = keyof typeof REJECT_REASONS;
