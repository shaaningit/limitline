-- LIMITLINE v1 schema and access rules (merged build list M4).
-- Decisions: D9 (server decides), D13 (founder-checked links), D15 (shop), D16 (boards),
-- D21 (seed limits with effort counts), D3 re-review (balance may go below zero),
-- design 3A/15A (boards show only %, members only, hide option), re-review #1/#2/#4/#7.
-- Ranking happens in lib/rules (buildBoard); this file decides who may see what.

-- Quest ids must match QUESTS in lib/rules/config.ts (a test fails if they differ).
create type public.quest_id as enum ('run5k', 'run10k', 'bike20', 'swim400', 'swim1500');

-- ---------- Profiles ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40), -- "First L."
  is_founder boolean not null default false,
  show_on_boards boolean not null default true,
  show_name_on_share boolean not null default false,
  checklist_followed boolean not null default false,   -- first-run step 1 (self-ticked, 7A)
  checklist_visibility boolean not null default false, -- first-run step 2 (self-ticked, 7A)
  signed_up_at timestamptz not null default now()
);

-- True when the signed-in user is the founder. Security definer so policies can call it
-- without recursing into profiles' own row rules.
create function public.is_founder() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_founder from public.profiles p where p.id = auth.uid()), false)
$$;

-- ---------- Entries: one submitted Strava activity ----------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  quest_id public.quest_id not null,                       -- athlete picks (2A), founder may change
  link text not null check (char_length(link) <= 500),
  strava_activity_id text unique,                          -- each activity counts once (D11)
  status text not null default 'waiting' check (status in ('waiting', 'verified', 'rejected')),
  reject_reason text check (reject_reason in
    ('cant_view', 'before_signup', 'needs_power', 'not_outdoor', 'not_own', 'not_completed')),
  activity_at timestamptz,                                 -- read off Strava by the founder (re-review #1)
  value numeric check (value > 0),                         -- seconds, or watts for bike20
  -- Results computed by lib/rules on the server and stored; recomputed on corrections.
  percent numeric,
  beat_limit boolean,
  embers integer check (embers >= 0),
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  seen_at timestamptz,                                     -- result card shows until seen (5A)
  email_status text check (email_status in ('pending', 'sent', 'failed')),
  check (status <> 'verified' or (activity_at is not null and value is not null
                                  and strava_activity_id is not null and embers is not null)),
  check (status <> 'rejected' or reject_reason is not null)
);

create index entries_athlete_quest_time on public.entries (athlete_id, quest_id, activity_at);
create index entries_verified_time on public.entries (activity_at) where status = 'verified';

-- ---------- Seed limits (D21) ----------

create table public.seed_limits (
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  quest_id public.quest_id not null,
  value numeric not null check (value > 0),
  effort_count integer not null check (effort_count >= 0),
  primary key (athlete_id, quest_id)
);

-- ---------- Shop (D15) ----------

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  price integer not null check (price > 0),
  stock integer not null check (stock >= 0),
  active boolean not null default true
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.shop_items (id),
  price integer not null check (price > 0),
  status text not null default 'requested' check (status in ('requested', 'handed_over', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Embers balance = earned on verified entries - spent on non-cancelled redemptions.
-- Derived, never stored, so corrections can't leave it stale; it may go below zero (D3).
create function public.embers_balance(p_athlete uuid) returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select sum(e.embers) from public.entries e
                   where e.athlete_id = p_athlete and e.status = 'verified'), 0)::integer
       - coalesce((select sum(r.price) from public.redemptions r
                   where r.athlete_id = p_athlete and r.status <> 'cancelled'), 0)::integer
$$;

-- Redeem one item for the signed-in athlete. Locks the athlete's profile row so a
-- double tap can't spend twice, checks balance and stock, then records the spend.
create function public.redeem(p_item uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_athlete uuid := auth.uid();
  v_item public.shop_items%rowtype;
  v_balance integer;
  v_id uuid;
begin
  if v_athlete is null then raise exception 'not signed in'; end if;
  perform 1 from public.profiles where id = v_athlete for update;
  if not found then raise exception 'no profile'; end if;

  select * into v_item from public.shop_items where id = p_item and active for update;
  if not found then raise exception 'item not available'; end if;
  if v_item.stock < 1 then raise exception 'sold out'; end if;

  v_balance := public.embers_balance(v_athlete);
  if v_balance < v_item.price then raise exception 'not enough embers'; end if;

  update public.shop_items set stock = stock - 1 where id = p_item;
  insert into public.redemptions (athlete_id, item_id, price)
    values (v_athlete, p_item, v_item.price) returning id into v_id;
  return v_id;
end
$$;

-- Board data for one pilot week: verified entries of athletes who show on boards.
-- Only what boards need: no link, no raw time or watts (3A). Members only (re-review #4).
-- lib/rules/buildBoard ranks these rows.
create function public.board_entries(p_week_start date, p_time_zone text)
returns table (
  athlete_id uuid,
  display_name text,
  quest_id public.quest_id,
  percent numeric,
  beat_limit boolean,
  activity_at timestamptz,
  is_me boolean
)
language sql stable security definer set search_path = ''
as $$
  select e.athlete_id, p.display_name, e.quest_id, e.percent, e.beat_limit, e.activity_at,
         e.athlete_id = auth.uid()
  from public.entries e
  join public.profiles p on p.id = e.athlete_id
  where auth.uid() is not null
    and exists (select 1 from public.profiles me where me.id = auth.uid())
    and e.status = 'verified'
    and p.show_on_boards
    and (e.activity_at at time zone p_time_zone)::date >= p_week_start
    and (e.activity_at at time zone p_time_zone)::date < p_week_start + 7
$$;

-- ---------- Access rules ----------

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.seed_limits enable row level security;
alter table public.shop_items enable row level security;
alter table public.redemptions enable row level security;

-- Logged-out visitors get nothing (Supabase grants public objects to anon by default).
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_founder(), public.embers_balance(uuid), public.redeem(uuid),
  public.board_entries(date, text) to authenticated;

-- Athletes may change only their own display and privacy settings; never is_founder.
revoke all on public.profiles from authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name, show_on_boards, show_name_on_share, checklist_followed, checklist_visibility)
  on public.profiles to authenticated;
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_founder());
create policy "create own profile" on public.profiles for insert
  with check (id = auth.uid() and is_founder = false);
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "founder updates profiles" on public.profiles for update using (public.is_founder());

-- Entries: athletes see and submit their own; they can only mark results as seen.
revoke all on public.entries from authenticated;
grant select on public.entries to authenticated;
grant insert (athlete_id, quest_id, link, strava_activity_id) on public.entries to authenticated;
-- Update/delete are narrowed by the policies below; the guard trigger limits athletes to seen_at.
grant update, delete on public.entries to authenticated;
create policy "read own entries" on public.entries for select
  using (athlete_id = auth.uid() or public.is_founder());
create policy "submit own entry" on public.entries for insert
  with check (athlete_id = auth.uid() and status = 'waiting');
create policy "mark own result seen" on public.entries for update
  using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "founder manages entries" on public.entries for all
  using (public.is_founder()) with check (public.is_founder());

-- Column guard: athletes' updates may touch seen_at only (the table-wide update grant
-- above exists for the founder; this trigger stops athletes using it on other columns).
create function public.entries_athlete_update_guard() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not public.is_founder() and (to_jsonb(new) - 'seen_at') <> (to_jsonb(old) - 'seen_at') then
    raise exception 'athletes may only mark results as seen';
  end if;
  return new;
end
$$;
create trigger entries_athlete_update_guard before update on public.entries
  for each row execute function public.entries_athlete_update_guard();

-- Seeds: athletes read their own (to show limits); only the founder writes.
revoke all on public.seed_limits from authenticated;
grant select, insert, update, delete on public.seed_limits to authenticated;
create policy "read own seeds" on public.seed_limits for select
  using (athlete_id = auth.uid() or public.is_founder());
create policy "founder manages seeds" on public.seed_limits for all
  using (public.is_founder()) with check (public.is_founder());

-- Shop: signed-in members see active items; only the founder manages items.
revoke all on public.shop_items from authenticated;
grant select, insert, update, delete on public.shop_items to authenticated;
create policy "members see active items" on public.shop_items for select
  using ((active and auth.uid() is not null) or public.is_founder());
create policy "founder manages items" on public.shop_items for all
  using (public.is_founder()) with check (public.is_founder());

-- Redemptions: created only through redeem(); athletes read their own; founder hands over.
revoke all on public.redemptions from authenticated;
grant select, update on public.redemptions to authenticated;
create policy "read own redemptions" on public.redemptions for select
  using (athlete_id = auth.uid() or public.is_founder());
create policy "founder updates redemptions" on public.redemptions for update
  using (public.is_founder()) with check (public.is_founder());
