-- Bilingual site (English + Hindi).
--
-- Each post is written in its main language (article_lang) and may carry an optional
-- version in the other language: *_alt columns on episodes, body_alt next to the main
-- article body (so the same RLS keeps premium translations away from visitors).
-- Categories get Hindi names; the profile gets a Hindi version as a JSON object.

alter table public.episodes
  add column title_alt       text    not null default '' check (char_length(title_alt) <= 160),
  add column excerpt_alt     text    not null default '' check (char_length(excerpt_alt) <= 280),
  add column description_alt text    not null default '' check (char_length(description_alt) <= 10000),
  add column has_article_alt boolean not null default false;

-- A post may now have only the other-language article, so either body may be empty.
alter table public.episode_articles drop constraint episode_articles_body_check;
alter table public.episode_articles
  add constraint episode_articles_body_check check (char_length(body) <= 60000),
  add column body_alt text not null default '' check (char_length(body_alt) <= 60000);

alter table public.episodes drop constraint published_needs_content;
alter table public.episodes add constraint published_needs_content
  check (not is_published or audio_storage_path is not null or has_article or has_article_alt);

alter table public.categories
  add column name_hi        text not null default '' check (char_length(name_hi) <= 120),
  add column description_hi text not null default '' check (char_length(description_hi) <= 500);

alter table public.profiles
  add column hi jsonb not null default '{}'::jsonb check (jsonb_typeof(hi) = 'object');

update public.categories c set name_hi = v.name_hi, description_hi = v.description_hi
from (values
  ('cricket-astrology', 'क्रिकेट ज्योतिष', 'क्रिकेट मैचों का ज्योतिषीय विश्लेषण, बिग बैश लीग से शुरुआत।'),
  ('daily-astrology', 'दैनिक ज्योतिष', 'दिन की ग्रह-स्थिति पर छोटे दैनिक विचार।'),
  ('horoscope-insights', 'राशिफल विचार', 'हर राशि के लिए साप्ताहिक और मासिक राशिफल चर्चा।'),
  ('planetary-transits', 'ग्रह गोचर', 'बड़े ग्रह-गोचर का क्या अर्थ हो सकता है, सरल भाषा में।'),
  ('zodiac-sign-guidance', 'राशि मार्गदर्शन', 'हर राशि के स्वभाव, रिश्तों और समय पर मार्गदर्शन।'),
  ('vedic-astrology', 'वैदिक ज्योतिष', 'ज्योतिष की मूल बातें: नक्षत्र, दशा, भाव और उपाय।'),
  ('spirituality-and-meditation', 'अध्यात्म और ध्यान', 'ज्योतिषीय विषयों से प्रेरित चिंतन और ध्यान।'),
  ('astrology-learning', 'ज्योतिष सीखें', 'उन श्रोताओं के लिए पाठ जो स्वयं ज्योतिष सीखना चाहते हैं।'),
  ('planets-grahas', 'ग्रह', 'शनि, शुक्र, गुरु और अन्य ग्रह: उनका स्वभाव, प्रभाव और उपाय।')
) as v(slug, name_hi, description_hi)
where c.slug = v.slug and c.name_hi = '';

-- Recreate the listing view with the translated article body and Hindi category name.
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

-- Save both language versions atomically with the rest of the post.
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
  v_article_alt text := btrim(coalesce(p_episode->>'article_alt', ''));
  v_has_article boolean := char_length(btrim(coalesce(p_episode->>'article', ''))) > 0;
  v_has_article_alt boolean := char_length(btrim(coalesce(p_episode->>'article_alt', ''))) > 0;
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
    insert into public.episodes (title, slug, excerpt, description, title_alt, excerpt_alt, description_alt,
                                 has_article, has_article_alt, article_lang, category_id, audio_storage_path,
                                 audio_mime_type, cover_image_path, duration_seconds, is_published, is_premium, published_at)
    values (p_episode->>'title', p_episode->>'slug', p_episode->>'excerpt', p_episode->>'description',
            coalesce(p_episode->>'title_alt', ''), coalesce(p_episode->>'excerpt_alt', ''),
            coalesce(p_episode->>'description_alt', ''),
            v_has_article, v_has_article_alt, coalesce(p_episode->>'article_lang', 'hi'),
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
      title_alt = coalesce(p_episode->>'title_alt', ''),
      excerpt_alt = coalesce(p_episode->>'excerpt_alt', ''),
      description_alt = coalesce(p_episode->>'description_alt', ''),
      has_article = v_has_article,
      has_article_alt = v_has_article_alt,
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

  if v_has_article or v_has_article_alt then
    insert into public.episode_articles (episode_id, body, body_alt) values (v_id, v_article, v_article_alt)
    on conflict (episode_id) do update set body = excluded.body, body_alt = excluded.body_alt;
  else
    delete from public.episode_articles where episode_id = v_id;
  end if;

  return v_id;
end;
$$;
