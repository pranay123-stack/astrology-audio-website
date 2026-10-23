-- Saved KP charts. Visitors sign in (Google) and keep their own charts and notes.
-- Each user sees and changes only their own rows; visitors without an account see nothing.
-- Only the birth details are stored; the chart itself is recalculated when opened.

create table public.kp_charts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 80),
  birth      jsonb not null check (jsonb_typeof(birth) = 'object' and pg_column_size(birth) <= 2000),
  notes      text not null default '' check (char_length(notes) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kp_charts_user_created on public.kp_charts (user_id, created_at desc);
create trigger kp_charts_touch before update on public.kp_charts
  for each row execute function public.touch_updated_at();

-- A generous cap per account, so one user cannot fill the database.
create or replace function public.kp_charts_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.kp_charts where user_id = new.user_id) >= 500 then
    raise exception 'Chart limit reached (500)' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger kp_charts_limit before insert on public.kp_charts
  for each row execute function public.kp_charts_limit();
revoke all on function public.kp_charts_limit() from public, anon, authenticated;

alter table public.kp_charts enable row level security;
create policy "users read their own charts" on public.kp_charts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users add their own charts" on public.kp_charts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users change their own charts" on public.kp_charts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users delete their own charts" on public.kp_charts for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.kp_charts from anon;
grant select, insert, update, delete on public.kp_charts to authenticated;
