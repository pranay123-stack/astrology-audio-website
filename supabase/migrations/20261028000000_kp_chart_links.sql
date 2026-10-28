-- Each saved KP chart has its own page (/kp-chart/<id>), and its owner can share that link.
--
-- * The owner always opens their chart by its link (when signed in).
-- * Anyone else opens it only after the owner turns sharing on (is_shared). They see the birth
--   details and the chart, never the owner's notes or account.
-- * Shared charts are fetched one at a time by id (an unguessable uuid) through kp_chart_get;
--   the table itself stays private, so shared charts cannot be listed or searched.

alter table public.kp_charts add column is_shared boolean not null default false;

create or replace function public.kp_chart_get(p_id uuid)
returns table (id uuid, name text, birth jsonb, notes text, is_shared boolean, is_owner boolean, created_at timestamptz)
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
         c.created_at
  from public.kp_charts c
  where c.id = p_id
    and (c.is_shared or c.user_id = (select auth.uid()));
$$;
revoke all on function public.kp_chart_get(uuid) from public;
grant execute on function public.kp_chart_get(uuid) to anon, authenticated;
