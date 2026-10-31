-- Access-rule tests for the init migration. Run with scripts/test-db.sh.
-- Each check raises 'TEST FAIL: ...' if the rule is broken.
\set ON_ERROR_STOP on

-- ---------- Fixture data (as the database owner) ----------
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000f0'),  -- founder
  ('00000000-0000-0000-0000-00000000000a'),  -- athlete A (Priya)
  ('00000000-0000-0000-0000-00000000000b'),  -- athlete B (Dana)
  ('00000000-0000-0000-0000-00000000000c'),  -- athlete C (Lee, hidden from boards)
  ('00000000-0000-0000-0000-00000000000d');  -- athlete D (just signed up, no profile yet)

insert into public.profiles (id, display_name, is_founder, show_on_boards) values
  ('00000000-0000-0000-0000-0000000000f0', 'Founder', true, false),
  ('00000000-0000-0000-0000-00000000000a', 'Priya R.', false, true),
  ('00000000-0000-0000-0000-00000000000b', 'Dana K.', false, true),
  ('00000000-0000-0000-0000-00000000000c', 'Lee W.', false, false);

insert into public.entries (id, athlete_id, quest_id, link, strava_activity_id, status, activity_at, value, percent, beat_limit, embers)
values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'run5k',
   'https://www.strava.com/activities/111', '111', 'verified', '2026-11-18T07:00:00Z', 1558, 3.3, true, 20),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'run10k',
   'https://www.strava.com/activities/222', '222', 'verified', '2026-11-18T07:00:00Z', 2892, 2.9, true, 20),
  ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c', 'run5k',
   'https://www.strava.com/activities/333', '333', 'verified', '2026-11-18T07:00:00Z', 1500, 5.0, true, 20),
  ('10000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'run5k',
   'https://www.strava.com/activities/444', '444', 'verified', '2026-11-25T07:00:00Z', 1600, -2.7, false, 10);

insert into public.seed_limits values
  ('00000000-0000-0000-0000-00000000000a', 'run5k', 1612, 4),
  ('00000000-0000-0000-0000-00000000000b', 'run10k', 2980, 5);

insert into public.shop_items (id, name, price, stock) values
  ('20000000-0000-0000-0000-000000000001', 'Gel pack', 15, 1);

-- ---------- Logged-out visitor ----------
-- Direct check: anon holds no privileges on any LIMITLINE table (not just blocked by a policy).
do $$
declare t text;
begin
  foreach t in array array['profiles', 'entries', 'seed_limits', 'shop_items', 'redemptions'] loop
    if has_table_privilege('anon', 'public.' || t, 'SELECT, INSERT, UPDATE, DELETE') then
      raise exception 'TEST FAIL: anon has privileges on %', t;
    end if;
  end loop;
end $$;

set role anon;
set app.uid = '';
do $$ begin
  begin perform 1 from public.entries; raise exception 'TEST FAIL: anon read entries';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.shop_items; raise exception 'TEST FAIL: anon read shop';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.board_entries('2026-11-16', 'UTC'); raise exception 'TEST FAIL: anon read board';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------- Athlete A ----------
set role authenticated;
set app.uid = '00000000-0000-0000-0000-00000000000a';

do $$ begin
  if (select count(*) from public.entries) <> 2 then
    raise exception 'TEST FAIL: athlete should see only their own 2 entries';
  end if;
  if exists (select 1 from public.seed_limits where athlete_id <> auth.uid()) then
    raise exception 'TEST FAIL: athlete can read another athlete''s seeds';
  end if;
  if exists (select 1 from public.profiles where id <> auth.uid()) then
    raise exception 'TEST FAIL: athlete can read other profiles';
  end if;
end $$;

-- Board: members see others' %, never raw values; hidden athletes are left out.
do $$
declare n int; mine int; hidden int;
begin
  select count(*), count(*) filter (where is_me), count(*) filter (where display_name = 'Lee W.')
    into n, mine, hidden from public.board_entries('2026-11-16', 'UTC');
  if n <> 2 or mine <> 1 or hidden <> 0 then
    raise exception 'TEST FAIL: board rows n=% mine=% hidden=%', n, mine, hidden;
  end if;
end $$;

-- The board function's result has no raw value or link columns (design 3A).
do $$ begin
  if exists (
    select 1 from unnest((select proargnames from pg_proc where proname = 'board_entries')) a
    where a in ('value', 'link', 'strava_activity_id')
  ) then raise exception 'TEST FAIL: board exposes raw columns'; end if;
end $$;

-- Athletes can mark a result seen, but not change its numbers, status or anyone's founder flag.
update public.entries set seen_at = now() where id = '10000000-0000-0000-0000-00000000000a';
do $$ begin
  begin
    update public.entries set value = 1000 where id = '10000000-0000-0000-0000-00000000000a';
    raise exception 'TEST FAIL: athlete changed a verified value';
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
  begin
    update public.entries set embers = 999 where id = '10000000-0000-0000-0000-00000000000b';
    if found then raise exception 'TEST FAIL: athlete updated another athlete''s entry'; end if;
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
  begin
    update public.profiles set is_founder = true where id = auth.uid();
    raise exception 'TEST FAIL: athlete made themselves founder';
  exception when insufficient_privilege then null; end;
end $$;

-- Submitting: own entries only, waiting status only, each Strava activity once.
insert into public.entries (athlete_id, quest_id, link, strava_activity_id)
  values (auth.uid(), 'run10k', 'https://www.strava.com/activities/555', '555');
do $$ begin
  begin
    insert into public.entries (athlete_id, quest_id, link)
      values ('00000000-0000-0000-0000-00000000000b', 'run5k', 'https://www.strava.com/activities/666');
    raise exception 'TEST FAIL: athlete submitted for someone else';
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
  begin
    insert into public.entries (athlete_id, quest_id, link, strava_activity_id)
      values (auth.uid(), 'run5k', 'https://www.strava.com/activities/111', '111');
    raise exception 'TEST FAIL: duplicate Strava activity accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.entries (athlete_id, quest_id, link, status, embers)
      values (auth.uid(), 'run5k', 'https://www.strava.com/activities/777', 'verified', 50);
    raise exception 'TEST FAIL: athlete self-verified an entry';
  exception when insufficient_privilege then null; end;
end $$;

-- Shop: balance is 20 + 10 = 30; redeeming a 15-ember item works once; then it's sold out.
do $$ begin
  if public.embers_balance(auth.uid()) <> 30 then raise exception 'TEST FAIL: balance should be 30'; end if;
  perform public.redeem('20000000-0000-0000-0000-000000000001');
  if public.embers_balance(auth.uid()) <> 15 then raise exception 'TEST FAIL: balance should be 15 after redeem'; end if;
  begin
    perform public.redeem('20000000-0000-0000-0000-000000000001');
    raise exception 'TEST FAIL: redeemed a sold-out item';
  exception when others then if sqlerrm not like '%sold out%' then raise; end if; end;
end $$;
reset role;

-- ---------- New athlete creating their profile ----------
set role authenticated;
set app.uid = '00000000-0000-0000-0000-00000000000d';
do $$ begin
  begin
    insert into public.profiles (id, display_name, is_founder) values (auth.uid(), 'Sneaky S.', true);
    raise exception 'TEST FAIL: athlete signed up as founder';
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
  begin
    insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-00000000000b', 'Fake D.');
    raise exception 'TEST FAIL: athlete created a profile for someone else';
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
end $$;
insert into public.profiles (id, display_name) values (auth.uid(), 'Sam O.');
reset role;

-- ---------- Founder ----------
set role authenticated;
set app.uid = '00000000-0000-0000-0000-0000000000f0';
do $$ begin
  if (select count(*) from public.entries) <> 5 then raise exception 'TEST FAIL: founder should see all entries'; end if;
end $$;

-- A correction takes back embers already spent: balance goes below zero (re-review D3).
update public.entries set embers = 0, beat_limit = false, percent = -1
  where id = '10000000-0000-0000-0000-00000000000a';
update public.entries set embers = 0 where id = '10000000-0000-0000-0000-0000000000a2';
do $$ begin
  if public.embers_balance('00000000-0000-0000-0000-00000000000a') <> -15 then
    raise exception 'TEST FAIL: balance should be -15 after correction';
  end if;
end $$;
update public.redemptions set status = 'handed_over';
reset role;

-- With the balance below zero, athlete A can't redeem (shop locked).
insert into public.shop_items (id, name, price, stock) values ('20000000-0000-0000-0000-000000000002', 'Cap', 1, 5);
set role authenticated;
set app.uid = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  begin
    perform public.redeem('20000000-0000-0000-0000-000000000002');
    raise exception 'TEST FAIL: redeemed with a negative balance';
  exception when others then if sqlerrm not like '%not enough embers%' then raise; end if; end;
end $$;
reset role;

-- ---------- founder_update_entries: founder only, all or nothing ----------
set role authenticated;
set app.uid = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  begin
    perform public.founder_update_entries('[{"id": "10000000-0000-0000-0000-00000000000a", "embers": 999}]');
    raise exception 'TEST FAIL: athlete used founder_update_entries';
  exception when others then if sqlerrm not like '%founder only%' then raise; end if; end;
end $$;
reset role;

set role authenticated;
set app.uid = '00000000-0000-0000-0000-0000000000f0';
do $$ begin
  -- Second row doesn't exist: the first row's change must be rolled back too.
  begin
    perform public.founder_update_entries('[
      {"id": "10000000-0000-0000-0000-00000000000b", "embers": 5},
      {"id": "10000000-0000-0000-0000-0000000000ff", "embers": 5}]');
    raise exception 'TEST FAIL: batch with a missing row succeeded';
  exception when others then if sqlerrm like 'TEST FAIL%' then raise; end if; end;
  if (select embers from public.entries where id = '10000000-0000-0000-0000-00000000000b') <> 20 then
    raise exception 'TEST FAIL: partial batch was applied';
  end if;

  -- A valid batch applies every row; keys left out keep their values.
  if public.founder_update_entries('[
      {"id": "10000000-0000-0000-0000-00000000000b", "embers": 10, "beat_limit": false, "percent": -0.5}]') <> 1 then
    raise exception 'TEST FAIL: valid batch not applied';
  end if;
  if (select (embers, beat_limit, value) from public.entries where id = '10000000-0000-0000-0000-00000000000b')
     is distinct from (10, false, 2892::numeric) then
    raise exception 'TEST FAIL: valid batch applied wrong values';
  end if;

  -- Verifying without the required fields is refused by the table's checks.
  begin
    perform public.founder_update_entries('[{"id": "10000000-0000-0000-0000-00000000000a", "value": null}]');
    raise exception 'TEST FAIL: verified entry saved without a value';
  exception when check_violation then null; end;
end $$;
reset role;

\echo ALL ACCESS-RULE TESTS PASSED
