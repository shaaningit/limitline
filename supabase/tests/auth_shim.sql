-- Test-only stand-in for the parts of Supabase the migration relies on, so it can run on
-- plain Postgres: the anon/authenticated roles, auth.users, and auth.uid().
-- Never run this against a real Supabase project.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;  -- the server's secret key on Supabase
grant usage on schema public to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key);

-- Tests set the signed-in user with: set app.uid = '<uuid>';  (empty = logged out)
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase gives these roles default access to new public tables; mimic that so the
-- migration's revokes are actually tested.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
