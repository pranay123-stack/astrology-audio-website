-- Team captains: a name and a photo per team (Admin > Leagues & teams), shown with the team logos
-- in the home page's latest-match stage. The photo lives in the public images bucket under teams/,
-- like the logo; only photos the astrologer may use should be uploaded.
alter table public.teams
  add column captain_name text check (captain_name is null or char_length(captain_name) between 2 and 80),
  add column captain_photo_path text;

-- Recreate the listing view with the captains (definition otherwise unchanged).
drop view public.episode_listings;
create view public.episode_listings
with (security_invoker = true) as
select
  e.*,
  coalesce(a.body, '')     as article,
  coalesce(a.body_alt, '') as article_alt,
  c.name    as category_name,
  c.name_hi as category_name_hi,
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
  ta.captain_name       as team_a_captain_name,
  ta.captain_photo_path as team_a_captain_photo_path,
  tb.captain_name       as team_b_captain_name,
  tb.captain_photo_path as team_b_captain_photo_path,
  lower(concat_ws(' ', e.title, e.excerpt, e.description, e.title_alt, e.excerpt_alt, e.description_alt,
                  a.body, a.body_alt, c.name, c.name_hi, comp.name, comp.short_name,
                  ta.name, ta.short_name, tb.name, tb.short_name, m.venue)) as search_text
from public.episodes e
join public.categories c on c.id = e.category_id
left join public.episode_articles a on a.episode_id = e.id
left join public.cricket_matches m on m.episode_id = e.id
left join public.competitions comp on comp.id = m.competition_id
left join public.teams ta on ta.id = m.team_a_id
left join public.teams tb on tb.id = m.team_b_id;

grant select on public.episode_listings to anon, authenticated;
