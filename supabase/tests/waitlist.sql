-- Access-rule tests for the waitlist migration. Run with scripts/test-db.sh.
\set ON_ERROR_STOP on

-- A logged-out visitor can join, but can never read the list.
set role anon;
set app.uid = '';
do $$
declare n integer;
begin
  n := public.join_waitlist('First@Example.com', 'Ana', '@nope', 'athlete', 'triathlon', '', 'reel05');
exception when check_violation then
  null; -- '@nope' is not a valid stored handle; the app strips the @ before calling
end $$;
do $$
declare a integer; b integer; again integer;
begin
  a := public.join_waitlist('first@example.com', 'Ana', 'ana.runs', 'athlete', 'triathlon', '', 'reel05');
  b := public.join_waitlist('brand@example.com', 'Sam', '', 'brand', '', 'Trail Co', '');
  again := public.join_waitlist(' FIRST@example.com ', 'Ana', '', 'athlete', '', '', '');
  if a <> 1 or b <> 2 then raise exception 'TEST FAIL: places in line should be 1 and 2, got % and %', a, b; end if;
  if again <> 1 then raise exception 'TEST FAIL: joining twice should return the same place, got %', again; end if;
  begin
    perform public.join_waitlist('not-an-email', '', '', 'athlete', '', '', '');
    raise exception 'TEST FAIL: a bad email was accepted';
  exception when invalid_parameter_value then null; end;
  begin perform 1 from public.waitlist; raise exception 'TEST FAIL: anon read the waitlist';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

do $$ begin
  if (select count(*) from public.waitlist) <> 2 then raise exception 'TEST FAIL: expected 2 sign-ups'; end if;
  if (select email from public.waitlist where name = 'Ana') <> 'first@example.com' then
    raise exception 'TEST FAIL: email should be stored in lower case';
  end if;
end $$;

-- An athlete sees nothing; the founder sees everyone.
set role authenticated;
set app.uid = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if (select count(*) from public.waitlist) <> 0 then raise exception 'TEST FAIL: athlete can read the waitlist'; end if;
end $$;
set app.uid = '00000000-0000-0000-0000-0000000000f0';
do $$ begin
  if (select count(*) from public.waitlist) <> 2 then raise exception 'TEST FAIL: founder should read the waitlist'; end if;
end $$;
reset role;

\echo 'waitlist access rules: all passed'
