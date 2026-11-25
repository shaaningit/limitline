-- Waitlist (Nov 25): a public sign-up form for the Instagram bio while the app is built.
-- Visitors never read or write the table directly. They call join_waitlist(), which
-- saves the sign-up and returns their place in line. Only the founder can read the list.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity unique,  -- order of joining (place in line)
  email text not null unique check (email = lower(email) and char_length(email) between 3 and 254),
  name text check (char_length(name) <= 80),
  instagram text check (instagram ~ '^[a-z0-9._]{1,30}$'),
  role text not null default 'athlete' check (role in ('athlete', 'brand')),
  sport text check (sport in ('triathlon', 'run', 'ride', 'swim', 'hike')),
  company text check (char_length(company) <= 80),
  ref text check (ref ~ '^[a-z0-9_-]{1,40}$'),   -- which post or reel sent them (?ref= in the bio link)
  joined_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;
grant select on public.waitlist to authenticated;
create policy "founder reads waitlist" on public.waitlist for select using (public.is_founder());

-- Saves a sign-up (or finds the existing one for that email) and returns the place in line.
-- Security definer so logged-out visitors can join without any access to the table itself.
create function public.join_waitlist(
  p_email text, p_name text, p_instagram text, p_role text, p_sport text, p_company text, p_ref text
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_seq bigint;
begin
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  insert into public.waitlist (email, name, instagram, role, sport, company, ref)
  values (
    v_email,
    nullif(btrim(p_name), ''),
    nullif(lower(btrim(p_instagram)), ''),
    coalesce(nullif(p_role, ''), 'athlete'),
    nullif(p_sport, ''),
    nullif(btrim(p_company), ''),
    nullif(lower(btrim(p_ref)), '')
  )
  on conflict (email) do nothing;
  select w.seq into v_seq from public.waitlist w where w.email = v_email;
  return (select count(*) from public.waitlist w where w.seq <= v_seq)::integer;
end
$$;

revoke execute on function public.join_waitlist(text, text, text, text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text, text, text, text) to anon, authenticated;
