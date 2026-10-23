-- Cricket Astrology Guide: general cricket-astrology articles that live in the Cricket
-- section but are not readings of a particular match. Whether a post needs match details
-- (teams, date) is now a property of its category instead of "every cricket post".

alter table public.categories
  add column requires_match boolean not null default false;

update public.categories set requires_match = true where slug = 'cricket-astrology';

insert into public.categories (name, slug, description, section, sort_order, name_hi, description_hi, requires_match)
values ('Cricket Astrology Guide', 'cricket-astrology-guide',
        'How astrologers read a cricket match: the method, the houses, timing and the limits, explained for learners.',
        'cricket', 9, 'क्रिकेट ज्योतिष ज्ञान',
        'ज्योतिषी क्रिकेट मैच को कैसे पढ़ते हैं: पद्धति, भाव, समय और सीमाएँ, सीखने वालों के लिए सरल भाषा में।', false)
on conflict (slug) do nothing;

-- Save a post; match details are required (and stored) only for categories that need them.
create or replace function public.admin_save_episode(p_id uuid, p_episode jsonb, p_match jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_section text;
  v_requires_match boolean;
  v_article text := btrim(coalesce(p_episode->>'article', ''));
  v_article_alt text := btrim(coalesce(p_episode->>'article_alt', ''));
  v_has_article boolean := char_length(btrim(coalesce(p_episode->>'article', ''))) > 0;
  v_has_article_alt boolean := char_length(btrim(coalesce(p_episode->>'article_alt', ''))) > 0;
begin
  if not (select public.is_admin()) then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select c.section, c.requires_match into v_section, v_requires_match
  from public.categories c where c.id = (p_episode->>'category_id')::uuid;
  if v_section is null then
    raise exception 'Category not found' using errcode = '23503';
  end if;
  if v_requires_match and (p_match is null or jsonb_typeof(p_match) = 'null') then
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

  if v_requires_match then
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
