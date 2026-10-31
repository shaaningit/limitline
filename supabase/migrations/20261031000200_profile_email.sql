-- Result and correction emails (5A, re-review D3) need the athlete's address, but auth.users
-- isn't readable by the founder's session. Copy it into the profile at sign-up; profiles are
-- readable only by the athlete and the founder. (The table-wide insert grant covers this column;
-- athletes can't change it afterwards because it isn't in the update grant.)
alter table public.profiles add column email text check (email is null or char_length(email) <= 320);
