-- More quests (founder, Nov 3: "way more quests in the app, hiking too").
-- New run, ride, swim and hike quests, and a reason for trail quests done on the road.
-- Each new quest id must match QUESTS in lib/rules/config.ts (a test fails if they differ).
-- ADD VALUE can't be used in the same transaction it's added in; nothing here uses them.

alter type public.quest_id add value if not exists 'run1mile';
alter type public.quest_id add value if not exists 'runHalf';
alter type public.quest_id add value if not exists 'run5kTrail';
alter type public.quest_id add value if not exists 'bike40k';
alter type public.quest_id add value if not exists 'bike100k';
alter type public.quest_id add value if not exists 'swim3800';
alter type public.quest_id add value if not exists 'hike10k';
alter type public.quest_id add value if not exists 'hikeUp1000';
alter type public.quest_id add value if not exists 'hikeUp2000';

-- Climb quests store metres climbed in entries.value (higher is better, like watts).
alter table public.entries drop constraint entries_reject_reason_check;
alter table public.entries add constraint entries_reject_reason_check check (reject_reason in
  ('cant_view', 'before_signup', 'needs_power', 'not_outdoor', 'not_own', 'not_completed', 'wrong_sport', 'manual_entry', 'not_trail'));
