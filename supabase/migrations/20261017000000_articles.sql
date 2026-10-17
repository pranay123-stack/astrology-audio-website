-- Articles: a post can carry a written article (e.g. a Hindi piece on Shani or Shukra)
-- as well as, or instead of, audio. A published post needs audio OR an article.
--
-- Article bodies live in their own table so RLS can hide PREMIUM article text from
-- visitors entirely (a column on episodes would be readable through the public API).

alter table public.episodes
  add column has_article boolean not null default false,
  add column article_lang text not null default 'hi' check (article_lang in ('hi', 'en'));

create table public.episode_articles (
  episode_id uuid primary key references public.episodes (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 60000),
  updated_at timestamptz not null default now()
);
create trigger episode_articles_touch before update on public.episode_articles
  for each row execute function public.touch_updated_at();
alter table public.episode_articles enable row level security;

-- Visitors may read an article only when its post is live AND free. Admins read everything.
create policy "articles of live free posts are public" on public.episode_articles for select to anon, authenticated
  using (
    exists (
      select 1 from public.episodes e
      where e.id = episode_id and e.is_published and e.published_at <= now() and not e.is_premium
    )
    or (select public.is_admin())
  );
create policy "admins manage articles" on public.episode_articles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke insert, update, delete on public.episode_articles from anon;

alter table public.episodes drop constraint published_needs_audio;
alter table public.episodes add constraint published_needs_content
  check (not is_published or audio_storage_path is not null or has_article);

-- Recreate the listing view: exposes the article body (empty for premium, for visitors) and searches it.
drop view public.episode_listings;
create view public.episode_listings
with (security_invoker = true) as
select
  e.*,
  coalesce(a.body, '') as article,
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
  lower(concat_ws(' ', e.title, e.excerpt, e.description, a.body, c.name, comp.name, comp.short_name,
                  ta.name, ta.short_name, tb.name, tb.short_name, m.venue)) as search_text
from public.episodes e
join public.categories c on c.id = e.category_id
left join public.episode_articles a on a.episode_id = e.id
left join public.cricket_matches m on m.episode_id = e.id
left join public.competitions comp on comp.id = m.competition_id
left join public.teams ta on ta.id = m.team_a_id
left join public.teams tb on tb.id = m.team_b_id;

grant select on public.episode_listings to anon, authenticated;

-- Save the article atomically with the rest of the post.
create or replace function public.admin_save_episode(p_id uuid, p_episode jsonb, p_match jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_section text;
  v_article text := btrim(coalesce(p_episode->>'article', ''));
  v_has_article boolean := char_length(btrim(coalesce(p_episode->>'article', ''))) > 0;
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
    insert into public.episodes (title, slug, excerpt, description, has_article, article_lang, category_id, audio_storage_path,
                                 audio_mime_type, cover_image_path, duration_seconds, is_published, is_premium, published_at)
    values (p_episode->>'title', p_episode->>'slug', p_episode->>'excerpt', p_episode->>'description',
            v_has_article, coalesce(p_episode->>'article_lang', 'hi'),
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
      has_article = v_has_article,
      article_lang = coalesce(p_episode->>'article_lang', 'hi'),
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

  if v_has_article then
    insert into public.episode_articles (episode_id, body) values (v_id, v_article)
    on conflict (episode_id) do update set body = excluded.body;
  else
    delete from public.episode_articles where episode_id = v_id;
  end if;

  return v_id;
end;
$$;


-- A home for planet-focused content (Shani, Shukra, Guru, ...).
insert into public.categories (name, slug, description, section, sort_order)
values ('Planets (Grahas)', 'planets-grahas',
        'Shani, Shukra, Guru and the other grahas: their nature, influence and remedies.', 'general', 8)
on conflict (slug) do nothing;
