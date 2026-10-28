-- Charts dashboard: pinned charts, views (how often and when the owner last opened a chart),
-- and an "edited" date that changes only when the chart itself changes.

alter table public.kp_charts
  add column pinned         boolean     not null default false,
  add column view_count     integer     not null default 0 check (view_count >= 0),
  add column last_viewed_at timestamptz;

-- Opening, pinning or sharing a chart is not an edit: touch updated_at only for the name,
-- birth details and notes.
drop trigger kp_charts_touch on public.kp_charts;
create trigger kp_charts_touch before update on public.kp_charts
  for each row
  when (old.name is distinct from new.name or old.birth is distinct from new.birth or old.notes is distinct from new.notes)
  execute function public.touch_updated_at();

create index kp_charts_user_viewed on public.kp_charts (user_id, last_viewed_at desc);

-- The owner opened their chart. Row security limits the update to the caller's own charts.
create or replace function public.kp_chart_viewed(p_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.kp_charts
     set view_count = view_count + 1, last_viewed_at = now()
   where id = p_id and user_id = (select auth.uid());
$$;
revoke all on function public.kp_chart_viewed(uuid) from public, anon;
grant execute on function public.kp_chart_viewed(uuid) to authenticated;

-- kp_chart_get now also returns the edited date and the pin (owner only).
drop function public.kp_chart_get(uuid);
create function public.kp_chart_get(p_id uuid)
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
         case when c.user_id = (select auth.uid()) then c.notes else '' end,
         c.is_shared,
         coalesce(c.user_id = (select auth.uid()), false),
         c.created_at,
         c.updated_at,
         coalesce(c.user_id = (select auth.uid()), false) and c.pinned
  from public.kp_charts c
  where c.id = p_id
    and (c.is_shared or c.user_id = (select auth.uid()));
$$;
revoke all on function public.kp_chart_get(uuid) from public;
grant execute on function public.kp_chart_get(uuid) to anon, authenticated;
