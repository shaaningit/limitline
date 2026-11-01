-- Automatic checking through the Strava API (founder chose the Strava route, Nov 1).
-- An athlete connects Strava once; when they paste a link, the server reads the activity
-- from Strava's API and approves, rejects, or hands it to the founder with its numbers.
-- Trust model: athletes must never approve their own entries, so Strava results are written
-- only by the server holding the secret key (Postgres role service_role), never by the
-- athlete's session. Tokens are readable only by that role.

-- ---------- Strava connections (tokens: server only) ----------

create table public.strava_connections (
  athlete_id uuid primary key references public.profiles (id) on delete cascade,
  strava_athlete_id bigint not null unique,   -- one Strava account per LIMITLINE athlete
  strava_name text check (strava_name is null or char_length(strava_name) <= 100),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text not null,
  connected_at timestamptz not null default now()
);

alter table public.strava_connections enable row level security;
-- No policies and no grants for anon/authenticated: only service_role (which bypasses RLS)
-- can read or write tokens.
revoke all on public.strava_connections from anon, authenticated;

-- What the signed-in athlete may know about their own connection: never the tokens.
create function public.my_strava() returns table (strava_athlete_id bigint, strava_name text, connected_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select c.strava_athlete_id, c.strava_name, c.connected_at
  from public.strava_connections c
  where c.athlete_id = auth.uid()
$$;
revoke execute on function public.my_strava() from public, anon;
grant execute on function public.my_strava() to authenticated;

-- ---------- Entries: who checked it, and what Strava said ----------

alter table public.entries
  add column checked_by text check (checked_by in ('founder', 'strava')),
  -- Plain-words note from the Strava check: the measured numbers, or why it went to the founder.
  add column strava_note text check (strava_note is null or char_length(strava_note) <= 300),
  -- The Strava check's numbers for the founder to approve in one step:
  -- { "quest_id", "strava_activity_id", "activity_at", "value" }.
  add column suggested jsonb;

-- Two new reasons the automatic check can give (the founder can use them too).
alter table public.entries drop constraint entries_reject_reason_check;
alter table public.entries add constraint entries_reject_reason_check check (reject_reason in
  ('cant_view', 'before_signup', 'needs_power', 'not_outdoor', 'not_own', 'not_completed', 'wrong_sport', 'manual_entry'));

-- Athletes' updates may still touch seen_at only. The server's Strava check (service_role)
-- may write results, like the founder.
create or replace function public.entries_athlete_update_guard() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not public.is_founder() and current_user <> 'service_role'
     and (to_jsonb(new) - 'seen_at') <> (to_jsonb(old) - 'seen_at') then
    raise exception 'athletes may only mark results as seen';
  end if;
  return new;
end
$$;

-- ---------- One all-or-nothing writer, used by the founder and by the Strava check ----------

-- Security invoker on purpose: only roles granted execute can call it, and the guard trigger
-- still sees who is really writing.
create function public.apply_entry_rows(p_rows jsonb) returns integer
language plpgsql set search_path = ''
as $$
declare
  r jsonb;
  n integer := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    update public.entries e set
      status             = coalesce(r ->> 'status', e.status),
      quest_id           = coalesce((r ->> 'quest_id')::public.quest_id, e.quest_id),
      strava_activity_id = case when r ? 'strava_activity_id' then r ->> 'strava_activity_id' else e.strava_activity_id end,
      activity_at        = case when r ? 'activity_at' then (r ->> 'activity_at')::timestamptz else e.activity_at end,
      value              = case when r ? 'value' then (r ->> 'value')::numeric else e.value end,
      percent            = case when r ? 'percent' then (r ->> 'percent')::numeric else e.percent end,
      beat_limit         = case when r ? 'beat_limit' then (r ->> 'beat_limit')::boolean else e.beat_limit end,
      embers             = case when r ? 'embers' then (r ->> 'embers')::integer else e.embers end,
      reject_reason      = case when r ? 'reject_reason' then r ->> 'reject_reason' else e.reject_reason end,
      verified_at        = case when r ? 'verified_at' then (r ->> 'verified_at')::timestamptz else e.verified_at end,
      email_status       = case when r ? 'email_status' then r ->> 'email_status' else e.email_status end,
      checked_by         = case when r ? 'checked_by' then r ->> 'checked_by' else e.checked_by end,
      strava_note        = case when r ? 'strava_note' then r ->> 'strava_note' else e.strava_note end,
      suggested          = case when r ? 'suggested' then r -> 'suggested' else e.suggested end
    where e.id = (r ->> 'id')::uuid;
    if not found then raise exception 'entry % not found', r ->> 'id'; end if;
    n := n + 1;
  end loop;
  return n;
end
$$;
revoke execute on function public.apply_entry_rows(jsonb) from public, anon, authenticated;
-- service_role exists on Supabase (and in the test shim).
grant execute on function public.apply_entry_rows(jsonb) to service_role;

-- The founder's save now goes through the same writer (definer: runs with owner rights,
-- and the guard trigger lets the founder through).
create or replace function public.founder_update_entries(p_rows jsonb) returns integer
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_founder() then raise exception 'founder only'; end if;
  return public.apply_entry_rows(p_rows);
end
$$;
