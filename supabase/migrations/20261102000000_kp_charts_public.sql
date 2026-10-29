-- KP charts are public (the astrologer's decision, 29 Oct 2026):
--
-- * Anyone can make and save a chart without signing in; every chart gets its own link.
-- * Anyone can open any chart, and /kp-chart/all lists every chart. Notes stay with the chart's
--   owner, and nobody else can change or delete a chart.
-- * The owner is the signed-in account that made it, or (signed out) the browser that made it:
--   that browser keeps a random key, and only its SHA-256 is stored here. Administrators can
--   also edit and delete any chart.
--
-- The table stays closed to anonymous visitors; everything goes through the functions below.

alter table public.kp_charts
  alter column user_id drop not null,
  add column edit_key bytea,
  alter column is_shared set default true;
update public.kp_charts set is_shared = true where not is_shared;

-- The caller may change the chart: its account, the key of the browser that made it, or an admin.
create or replace function public.kp_chart_can_edit(p_user uuid, p_edit_key bytea, p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_user = (select auth.uid()), false)
      or coalesce(p_edit_key = sha256(convert_to(p_key, 'UTF8')), false)
      or (select public.is_admin());
$$;
revoke all on function public.kp_chart_can_edit(uuid, bytea, text) from public, anon, authenticated;

-- Saves a new chart. Signed out, it belongs to the browser holding p_key.
create or replace function public.kp_chart_create(p_name text, p_birth jsonb, p_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if p_key is null or char_length(p_key) not between 32 and 100 then
    raise exception 'Invalid chart key' using errcode = '22023';
  end if;
  -- Signed-out saves have no per-account cap, so cap them site-wide instead.
  if (select auth.uid()) is null
     and (select count(*) from public.kp_charts where user_id is null and created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Too many charts saved in the last hour. Please try again later.' using errcode = '23514';
  end if;
  insert into public.kp_charts (user_id, name, birth, edit_key)
  values ((select auth.uid()), coalesce(p_name, ''), p_birth, sha256(convert_to(p_key, 'UTF8')))
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.kp_chart_create(text, jsonb, text) from public;
grant execute on function public.kp_chart_create(text, jsonb, text) to anon, authenticated;

-- Any chart by its link; the notes only for whoever may edit it.
drop function public.kp_chart_get(uuid);
create function public.kp_chart_get(p_id uuid, p_key text default null)
returns table (id uuid, name text, birth jsonb, notes text, is_shared boolean, is_owner boolean,
               created_at timestamptz, updated_at timestamptz, pinned boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         c.name,
         c.birth,
         case when e.ok then c.notes else '' end,
         c.is_shared,
         e.ok,
         c.created_at,
         c.updated_at,
         coalesce(c.user_id = (select auth.uid()), false) and c.pinned
  from public.kp_charts c
  cross join lateral (select public.kp_chart_can_edit(c.user_id, c.edit_key, p_key) as ok) e
  where c.id = p_id;
$$;
revoke all on function public.kp_chart_get(uuid, text) from public;
grant execute on function public.kp_chart_get(uuid, text) to anon, authenticated;

-- Every chart, newest first, optionally filtered by name or place. Never the notes.
create or replace function public.kp_chart_list(p_q text default '', p_limit integer default 200)
returns table (id uuid, name text, birth jsonb, created_at timestamptz, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.birth, c.created_at, c.updated_at
  from public.kp_charts c
  where coalesce(p_q, '') = ''
     or c.name ilike '%' || p_q || '%'
     or (c.birth ->> 'place') ilike '%' || p_q || '%'
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;
revoke all on function public.kp_chart_list(text, integer) from public;
grant execute on function public.kp_chart_list(text, integer) to anon, authenticated;

-- Owner's changes. Each returns whether a chart was changed.
create or replace function public.kp_chart_edit(p_id uuid, p_key text, p_name text, p_birth jsonb)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with done as (
    update public.kp_charts c set name = coalesce(p_name, ''), birth = p_birth
     where c.id = p_id and public.kp_chart_can_edit(c.user_id, c.edit_key, p_key)
    returning 1
  )
  select exists (select 1 from done);
$$;

create or replace function public.kp_chart_set_notes(p_id uuid, p_key text, p_notes text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with done as (
    update public.kp_charts c set notes = coalesce(p_notes, '')
     where c.id = p_id and public.kp_chart_can_edit(c.user_id, c.edit_key, p_key)
    returning 1
  )
  select exists (select 1 from done);
$$;

create or replace function public.kp_chart_delete(p_id uuid, p_key text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with done as (
    delete from public.kp_charts c
     where c.id = p_id and public.kp_chart_can_edit(c.user_id, c.edit_key, p_key)
    returning 1
  )
  select exists (select 1 from done);
$$;

revoke all on function public.kp_chart_edit(uuid, text, text, jsonb) from public;
revoke all on function public.kp_chart_set_notes(uuid, text, text) from public;
revoke all on function public.kp_chart_delete(uuid, text) from public;
grant execute on function public.kp_chart_edit(uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.kp_chart_set_notes(uuid, text, text) to anon, authenticated;
grant execute on function public.kp_chart_delete(uuid, text) to anon, authenticated;
