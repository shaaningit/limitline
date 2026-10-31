-- Founder-only, all-or-nothing update of entries (eng review: corrections recompute later
-- results; they must never be half-applied). lib/rules computes the values; this applies them.
-- p_rows: [{ "id": uuid, "status": ..., "quest_id": ..., "strava_activity_id": ..., "activity_at": ...,
--            "value": ..., "percent": ..., "beat_limit": ..., "embers": ..., "reject_reason": ...,
--            "verified_at": ..., "email_status": ... }, ...]  Missing keys keep their current value.
create function public.founder_update_entries(p_rows jsonb) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  r jsonb;
  n integer := 0;
begin
  if not public.is_founder() then raise exception 'founder only'; end if;
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
      email_status       = case when r ? 'email_status' then r ->> 'email_status' else e.email_status end
    where e.id = (r ->> 'id')::uuid;
    if not found then raise exception 'entry % not found', r ->> 'id'; end if;
    n := n + 1;
  end loop;
  return n;
end
$$;

revoke execute on function public.founder_update_entries(jsonb) from public, anon;
grant execute on function public.founder_update_entries(jsonb) to authenticated;
