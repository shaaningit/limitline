// The single source of truth for quests and embers. Rules, pages, emails and
// the "How embers work" sheet all read from here (eng review: no hand-synced lists).

export type QuestId = "run5k" | "run10k" | "bike20" | "swim400" | "swim1500";
export type Sport = "run" | "bike" | "swim";
export type Measure = "time" | "power";

export interface Quest {
  id: QuestId;
  sport: Sport;
  label: string;
  measure: Measure;
  // Time quests: the distance covered. Power quests: the effort length.
  distanceMeters?: number;
  durationSeconds?: number;
}

export const QUESTS: Record<QuestId, Quest> = {
  run5k: { id: "run5k", sport: "run", label: "Run 5 km", measure: "time", distanceMeters: 5000 },
  run10k: { id: "run10k", sport: "run", label: "Run 10 km", measure: "time", distanceMeters: 10000 },
  bike20: { id: "bike20", sport: "bike", label: "Bike 20-min power", measure: "power", durationSeconds: 1200 },
  swim400: { id: "swim400", sport: "swim", label: "Swim 400 m", measure: "time", distanceMeters: 400 },
  swim1500: { id: "swim1500", sport: "swim", label: "Swim 1500 m", measure: "time", distanceMeters: 1500 },
};

export const QUEST_IDS = Object.keys(QUESTS) as QuestId[];

// One board per sport (D16): 5 km and 10 km share Run, 400 m and 1500 m share Swim.
export const BOARDS: Sport[] = ["run", "bike", "swim"];

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
} as const;

export type RejectReason = keyof typeof REJECT_REASONS;
