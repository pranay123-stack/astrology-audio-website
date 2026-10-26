-- Old post addresses keep working: when a post's slug changes, the old slug is remembered and
-- the site redirects /old-slug to the post's current address (301).

create table public.episode_slug_redirects (
  old_slug   text primary key check (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index episode_slug_redirects_episode_idx on public.episode_slug_redirects (episode_id);
alter table public.episode_slug_redirects enable row level security;

-- Slugs are public anyway (they are in the URLs); the page itself still checks the post is live.
create policy "slug redirects are public" on public.episode_slug_redirects for select to anon, authenticated using (true);
revoke insert, update, delete on public.episode_slug_redirects from anon, authenticated;

-- Written only by this trigger, so it runs with the owner's rights.
create or replace function public.remember_old_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    insert into public.episode_slug_redirects (old_slug, episode_id) values (old.slug, new.id)
    on conflict (old_slug) do update set episode_id = excluded.episode_id, created_at = now();
  end if;
  -- A slug in use by a post is never also a redirect.
  delete from public.episode_slug_redirects where old_slug = new.slug;
  return new;
end;
$$;
revoke all on function public.remember_old_slug() from public, anon, authenticated;

create trigger episodes_remember_old_slug after insert or update of slug on public.episodes
  for each row execute function public.remember_old_slug();
