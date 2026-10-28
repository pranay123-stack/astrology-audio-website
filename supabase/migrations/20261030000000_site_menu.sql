-- New site menu (Astrology, Astro Cricket, Book, Horoscope Research):
--
-- * categories for KP research kundlis (with match data), cricket videos (podcast), player
--   horoscopes and the book (Hindi and English);
-- * competitions IPL and International T20 next to the Big Bash League;
-- * a post can be marked "old video" (archive), and can carry a PDF: an upload in the public
--   `documents` bucket (free to read and download) or a Google Drive link for larger files.

insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('KP Research Kundli', 'KP शोध कुंडली', 'kp-research', 'cricket', 10, true,
   'KP research kundlis with the match data.', 'मैच डेटा के साथ KP शोध कुंडलियाँ।'),
  ('Astro Cricket Videos', 'एस्ट्रो क्रिकेट वीडियो', 'cricket-podcast', 'cricket', 11, false,
   'Video podcasts on cricket and astrology.', 'क्रिकेट और ज्योतिष पर वीडियो पॉडकास्ट।'),
  ('Player Horoscopes', 'खिलाड़ियों की कुंडली', 'player-horoscopes', 'cricket', 12, false,
   'Horoscope research on cricket players.', 'क्रिकेट खिलाड़ियों की कुंडली पर शोध।'),
  ('Book (Hindi)', 'पुस्तक (हिंदी)', 'book-hindi', 'general', 20, false,
   'A Spiritual Punter, Bookie & Astrologer, in Hindi.', 'A Spiritual Punter, Bookie & Astrologer, हिंदी में।'),
  ('Book (English)', 'पुस्तक (अंग्रेज़ी)', 'book-english', 'general', 21, false,
   'A Spiritual Punter, Bookie & Astrologer, in English.', 'A Spiritual Punter, Bookie & Astrologer, अंग्रेज़ी में।')
on conflict (slug) do nothing;

insert into public.competitions (name, short_name, slug) values
  ('Indian Premier League', 'IPL', 'ipl'),
  ('International T20', 'T20I', 't20i')
on conflict (slug) do nothing;

alter table public.episodes
  add column is_archived      boolean not null default false,
  add column pdf_storage_path text,
  add column pdf_link         text    not null default '' check (char_length(pdf_link) <= 300);

alter table public.episodes drop constraint published_needs_content;
alter table public.episodes add constraint published_needs_content
  check (not is_published or audio_storage_path is not null or audio_link <> '' or has_article or has_article_alt
         or video_storage_path is not null or video_link <> '' or cardinality(gallery_paths) > 0
         or pdf_storage_path is not null or pdf_link <> '');

-- Public bucket for PDFs: free to read and download. 50 MB is the Supabase Free plan's per-file cap.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', true, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy "admins manage media" on storage.objects;
create policy "admins manage media" on storage.objects for all to authenticated
  using (bucket_id in ('audio', 'images', 'video', 'documents') and (select public.is_admin()))
  with check (bucket_id in ('audio', 'images', 'video', 'documents') and (select public.is_admin()));

-- Recreate the listing view so e.* picks up the new columns (definition otherwise unchanged).
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

-- Save a post, now including the archive mark and its PDF.
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
  v_gallery text[] := coalesce(
    (select array_agg(x order by ord) from jsonb_array_elements_text(coalesce(p_episode->'gallery_paths', '[]'::jsonb))
       with ordinality as g(x, ord)),
    '{}');
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
                                 audio_mime_type, cover_image_path, duration_seconds, is_published, is_premium, published_at,
                                 video_storage_path, video_mime_type, video_format, video_link, gallery_paths, audio_link,
                                 is_archived, pdf_storage_path, pdf_link)
    values (p_episode->>'title', p_episode->>'slug', p_episode->>'excerpt', p_episode->>'description',
            coalesce(p_episode->>'title_alt', ''), coalesce(p_episode->>'excerpt_alt', ''),
            coalesce(p_episode->>'description_alt', ''),
            v_has_article, v_has_article_alt, coalesce(p_episode->>'article_lang', 'hi'),
            (p_episode->>'category_id')::uuid, p_episode->>'audio_storage_path', p_episode->>'audio_mime_type',
            p_episode->>'cover_image_path', (p_episode->>'duration_seconds')::int,
            (p_episode->>'is_published')::boolean, (p_episode->>'is_premium')::boolean,
            (p_episode->>'published_at')::timestamptz,
            p_episode->>'video_storage_path', p_episode->>'video_mime_type',
            coalesce(p_episode->>'video_format', 'video'), coalesce(p_episode->>'video_link', ''), v_gallery,
            coalesce(p_episode->>'audio_link', ''),
            coalesce((p_episode->>'is_archived')::boolean, false), p_episode->>'pdf_storage_path',
            coalesce(p_episode->>'pdf_link', ''))
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
      published_at = (p_episode->>'published_at')::timestamptz,
      video_storage_path = p_episode->>'video_storage_path',
      video_mime_type = p_episode->>'video_mime_type',
      video_format = coalesce(p_episode->>'video_format', 'video'),
      video_link = coalesce(p_episode->>'video_link', ''),
      gallery_paths = v_gallery,
      audio_link = coalesce(p_episode->>'audio_link', ''),
      is_archived = coalesce((p_episode->>'is_archived')::boolean, false),
      pdf_storage_path = p_episode->>'pdf_storage_path',
      pdf_link = coalesce(p_episode->>'pdf_link', '')
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
revoke all on function public.admin_save_episode(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_episode(uuid, jsonb, jsonb) to authenticated;
