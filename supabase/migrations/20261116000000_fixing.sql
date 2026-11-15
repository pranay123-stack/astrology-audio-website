-- Fixing: matches where Rahu's impact showed, one post per match with its Kundli (KP chart) link,
-- newest match first. Horoscope Research › Fixing (/horoscope-research/fixing).
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Fixing', 'फ़िक्सिंग', 'fixing', 'cricket', 18, true,
   'Matches where Rahu''s impact showed, each with its Kundli link.',
   'वे मैच जिनमें राहु का प्रभाव दिखा, हर मैच अपनी कुंडली के लिंक के साथ।')
on conflict (slug) do nothing;
