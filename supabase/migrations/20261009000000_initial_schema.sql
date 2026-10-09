-- Astrology audio website: initial schema.
-- Public visitors can read published content only; administrators (rows in
-- public.admins) can manage everything. Media lives in two storage buckets:
--   audio  (private) — streamed through the app's /api/media/audio route
--   images (public)  — cover art, team logos and the astrologer's photo

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins can see the admin list" on public.admins
  for select to authenticated using ((select public.is_admin()));

-- Trigger-only helpers are not callable through the API.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Astrologer profile (single row)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  singleton            boolean not null default true unique check (singleton),
  display_name         text not null check (char_length(display_name) between 2 and 120),
  tagline              text not null default '' check (char_length(tagline) <= 200),
  biography            text not null default '' check (char_length(biography) <= 6000),
  experience           text not null default '' check (char_length(experience) <= 3000),
  specializations      text[] not null default '{}',
  profile_image_path   text,
  contact_email        text not null default '',
  contact_phone        text not null default '',
  location             text not null default '',
  consultation_info    text not null default '',
  social_links         jsonb not null default '{}'::jsonb,
  legal_business_name  text not null default '',
  legal_jurisdiction   text not null default '',
  updated_at           timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  section     text not null check (section in ('cricket', 'general')),
  sort_order  integer not null default 0
);

create table public.competitions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  short_name  text not null check (char_length(short_name) between 2 and 16),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  is_active   boolean not null default true
);

create table public.teams (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete restrict,
  name           text not null check (char_length(name) between 2 and 120),
  short_name     text not null check (char_length(short_name) between 2 and 6),
  logo_path      text,
  primary_color  text not null default '#4c1d95' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  unique (competition_id, name)
);
create index teams_competition_idx on public.teams (competition_id);

-- ---------------------------------------------------------------------------
-- Episodes and cricket match details
-- ---------------------------------------------------------------------------
create table public.episodes (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (char_length(title) between 3 and 160),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt             text not null default '' check (char_length(excerpt) <= 280),
  description         text not null default '' check (char_length(description) <= 10000),
  category_id         uuid not null references public.categories (id) on delete restrict,
  audio_storage_path  text,
  audio_mime_type     text,
  cover_image_path    text,
  duration_seconds    integer not null default 0 check (duration_seconds >= 0),
  is_published        boolean not null default false,
  is_premium          boolean not null default false,
  is_demo             boolean not null default false,
  play_count          integer not null default 0 check (play_count >= 0),
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint published_needs_audio check (not is_published or audio_storage_path is not null),
  constraint published_needs_date check (not is_published or published_at is not null)
);
create index episodes_live_idx on public.episodes (published_at desc) where is_published;
create index episodes_category_idx on public.episodes (category_id);
create index episodes_popular_idx on public.episodes (play_count desc) where is_published;
create trigger episodes_touch before update on public.episodes
  for each row execute function public.touch_updated_at();

create table public.cricket_matches (
  id             uuid primary key default gen_random_uuid(),
  episode_id     uuid not null unique references public.episodes (id) on delete cascade,
  competition_id uuid not null references public.competitions (id) on delete restrict,
  team_a_id      uuid not null references public.teams (id) on delete restrict,
  team_b_id      uuid not null references public.teams (id) on delete restrict,
  match_date     timestamptz not null,
  venue          text not null default '',
  match_status   text not null default 'scheduled'
                 check (match_status in ('scheduled', 'live', 'completed', 'abandoned', 'postponed')),
  check (team_a_id <> team_b_id)
);
create index cricket_matches_date_idx on public.cricket_matches (match_date);
create index cricket_matches_competition_idx on public.cricket_matches (competition_id);
create index cricket_matches_team_a_idx on public.cricket_matches (team_a_id);
create index cricket_matches_team_b_idx on public.cricket_matches (team_b_id);

-- Teams in a match must belong to the match's competition.
create or replace function public.check_match_teams()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.teams t
    where t.id in (new.team_a_id, new.team_b_id) and t.competition_id <> new.competition_id
  ) then
    raise exception 'Both teams must belong to the selected competition' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger cricket_matches_teams before insert or update on public.cricket_matches
  for each row execute function public.check_match_teams();

-- ---------------------------------------------------------------------------
-- Contact form messages (inserted by the server after validation)
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  email      text not null check (char_length(email) <= 200),
  subject    text not null default '' check (char_length(subject) <= 160),
  message    text not null check (char_length(message) between 10 and 5000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Premium module (inactive until payments are configured)
-- A purchase grants either one episode (episode_id) or all premium audio until
-- expires_at (a subscription, episode_id null). Rows are written only by the
-- server with the service role after a verified payment-provider webhook.
-- ---------------------------------------------------------------------------
create table public.purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  episode_id        uuid references public.episodes (id) on delete set null,
  kind              text not null check (kind in ('episode', 'subscription')),
  status            text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  provider          text not null,
  provider_reference text not null,
  amount_cents      integer not null check (amount_cents >= 0),
  currency          text not null check (char_length(currency) = 3),
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (provider, provider_reference),
  check ((kind = 'episode') = (episode_id is not null))
);
create index purchases_user_idx on public.purchases (user_id);

create or replace function public.has_premium_access(p_user uuid, p_episode uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.purchases p
    where p.user_id = p_user
      and p.status = 'paid'
      and (
        (p.kind = 'episode' and p.episode_id = p_episode)
        or (p.kind = 'subscription' and (p.expires_at is null or p.expires_at > now()))
      )
  );
$$;
-- Supabase grants EXECUTE on new functions to anon/authenticated by default, so revoke explicitly.
revoke all on function public.has_premium_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.has_premium_access(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Play counter: anyone may bump the count of a live episode, nothing else.
-- ---------------------------------------------------------------------------
create or replace function public.increment_play_count(p_episode uuid)
returns void language sql volatile security definer set search_path = '' as $$
  update public.episodes
     set play_count = play_count + 1
   where id = p_episode and is_published and published_at <= now();
$$;
revoke all on function public.increment_play_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_play_count(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.competitions     enable row level security;
alter table public.teams            enable row level security;
alter table public.episodes         enable row level security;
alter table public.cricket_matches  enable row level security;
alter table public.contact_messages enable row level security;
alter table public.purchases        enable row level security;

-- Reference data: public read, admin write.
create policy "profile is public" on public.profiles for select to anon, authenticated using (true);
create policy "admins manage profile" on public.profiles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "categories are public" on public.categories for select to anon, authenticated using (true);
create policy "admins manage categories" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "competitions are public" on public.competitions for select to anon, authenticated using (true);
create policy "admins manage competitions" on public.competitions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "teams are public" on public.teams for select to anon, authenticated using (true);
create policy "admins manage teams" on public.teams for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Episodes: visitors see only published episodes whose publication time has passed.
create policy "live episodes are public" on public.episodes for select to anon, authenticated
  using ((is_published and published_at <= now()) or (select public.is_admin()));
create policy "admins insert episodes" on public.episodes for insert to authenticated
  with check ((select public.is_admin()));
create policy "admins update episodes" on public.episodes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete episodes" on public.episodes for delete to authenticated
  using ((select public.is_admin()));

create policy "matches of live episodes are public" on public.cricket_matches for select to anon, authenticated
  using (
    exists (
      select 1 from public.episodes e
      where e.id = episode_id and ((e.is_published and e.published_at <= now()) or (select public.is_admin()))
    )
  );
create policy "admins manage matches" on public.cricket_matches for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Contact messages: no public access at all; the server inserts with the service role.
create policy "admins read messages" on public.contact_messages for select to authenticated
  using ((select public.is_admin()));
create policy "admins update messages" on public.contact_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete messages" on public.contact_messages for delete to authenticated
  using ((select public.is_admin()));

-- Purchases: a signed-in user can read their own; only the service role writes.
create policy "users read own purchases" on public.purchases for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Column privileges: the public roles may not write anything directly except via policies above.
revoke insert, update, delete on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Flattened listing view used by the website. security_invoker makes the
-- underlying tables' RLS apply to whoever queries the view.
-- ---------------------------------------------------------------------------
create view public.episode_listings
with (security_invoker = true) as
select
  e.*,
  c.name    as category_name,
  c.slug    as category_slug,
  c.section as category_section,
  m.id             as match_id,
  m.competition_id as match_competition_id,
  m.team_a_id      as match_team_a_id,
  m.team_b_id      as match_team_b_id,
  m.match_date,
  m.venue          as match_venue,
  m.match_status,
  comp.name       as competition_name,
  comp.short_name as competition_short_name,
  comp.slug       as competition_slug,
  ta.name          as team_a_name,
  ta.short_name    as team_a_short_name,
  ta.logo_path     as team_a_logo_path,
  ta.primary_color as team_a_color,
  tb.name          as team_b_name,
  tb.short_name    as team_b_short_name,
  tb.logo_path     as team_b_logo_path,
  tb.primary_color as team_b_color,
  lower(concat_ws(' ', e.title, e.excerpt, e.description, c.name, comp.name, comp.short_name,
                  ta.name, ta.short_name, tb.name, tb.short_name, m.venue)) as search_text
from public.episodes e
join public.categories c on c.id = e.category_id
left join public.cricket_matches m on m.episode_id = e.id
left join public.competitions comp on comp.id = m.competition_id
left join public.teams ta on ta.id = m.team_a_id
left join public.teams tb on tb.id = m.team_b_id;

grant select on public.episode_listings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets. Size and MIME limits are enforced by Supabase Storage itself.
-- Uploads are made with short-lived signed upload URLs issued by the server to
-- authenticated admins, so no direct client insert policy is required; the admin
-- policies below allow management from the Supabase dashboard as well.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', false, 209715200,
   array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave']),
  ('images', 'images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admins manage media" on storage.objects for all to authenticated
  using (bucket_id in ('audio', 'images') and (select public.is_admin()))
  with check (bucket_id in ('audio', 'images') and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Atomic episode save (episode row + optional cricket match row).
-- SECURITY INVOKER: the caller's RLS policies apply, so only admins succeed.
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_episode(p_id uuid, p_episode jsonb, p_match jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_section text;
begin
  if not (select public.is_admin()) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select c.section into v_section from public.categories c where c.id = (p_episode->>'category_id')::uuid;
  if v_section is null then
    raise exception 'Category not found' using errcode = '23503';
  end if;
  if v_section = 'cricket' and (p_match is null or jsonb_typeof(p_match) = 'null') then
    raise exception 'Cricket episodes need match details' using errcode = '23514';
  end if;

  if v_id is null then
    insert into public.episodes (title, slug, excerpt, description, category_id, audio_storage_path, audio_mime_type,
                                 cover_image_path, duration_seconds, is_published, is_premium, published_at)
    values (p_episode->>'title', p_episode->>'slug', p_episode->>'excerpt', p_episode->>'description',
            (p_episode->>'category_id')::uuid, p_episode->>'audio_storage_path', p_episode->>'audio_mime_type',
            p_episode->>'cover_image_path', (p_episode->>'duration_seconds')::int,
            (p_episode->>'is_published')::boolean, (p_episode->>'is_premium')::boolean,
            (p_episode->>'published_at')::timestamptz)
    returning id into v_id;
  else
    update public.episodes set
      title = p_episode->>'title',
      slug = p_episode->>'slug',
      excerpt = p_episode->>'excerpt',
      description = p_episode->>'description',
      category_id = (p_episode->>'category_id')::uuid,
      audio_storage_path = p_episode->>'audio_storage_path',
      audio_mime_type = p_episode->>'audio_mime_type',
      cover_image_path = p_episode->>'cover_image_path',
      duration_seconds = (p_episode->>'duration_seconds')::int,
      is_published = (p_episode->>'is_published')::boolean,
      is_premium = (p_episode->>'is_premium')::boolean,
      published_at = (p_episode->>'published_at')::timestamptz
    where id = v_id;
    if not found then
      raise exception 'Episode not found' using errcode = 'P0002';
    end if;
  end if;

  if v_section = 'cricket' then
    insert into public.cricket_matches (episode_id, competition_id, team_a_id, team_b_id, match_date, venue, match_status)
    values (v_id, (p_match->>'competition_id')::uuid, (p_match->>'team_a_id')::uuid, (p_match->>'team_b_id')::uuid,
            (p_match->>'match_date')::timestamptz, coalesce(p_match->>'venue', ''),
            coalesce(p_match->>'match_status', 'scheduled'))
    on conflict (episode_id) do update set
      competition_id = excluded.competition_id,
      team_a_id = excluded.team_a_id,
      team_b_id = excluded.team_b_id,
      match_date = excluded.match_date,
      venue = excluded.venue,
      match_status = excluded.match_status;
  else
    delete from public.cricket_matches where episode_id = v_id;
  end if;

  return v_id;
end;
$$;
revoke all on function public.admin_save_episode(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_episode(uuid, jsonb, jsonb) to authenticated;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.check_match_teams() from public, anon, authenticated;
