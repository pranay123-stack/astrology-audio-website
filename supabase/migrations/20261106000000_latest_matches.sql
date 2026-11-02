-- Menu: "Latest Matches" › Cricket Matches › BBL, IPL, T20, ODI › Men, Women. Posts need a match,
-- and the match's competition says where they are listed, so each men's and women's game gets a
-- competition of its own.
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Latest Matches', 'ताज़ा मैच', 'latest-matches', 'cricket', 16, true,
   'The latest cricket matches, men and women.', 'पुरुष और महिला क्रिकेट के ताज़ा मैच।')
on conflict (slug) do nothing;

insert into public.competitions (name, short_name, slug, description) values
  ('One Day International', 'ODI', 'odi', 'Men''s one-day internationals.'),
  ('Women''s Big Bash League', 'WBBL', 'wbbl', 'Australia''s women''s T20 domestic league.'),
  ('Women''s Premier League', 'WPL', 'wpl', 'India''s women''s T20 league.'),
  ('Women''s International T20', 'WT20I', 'wt20i', 'Women''s T20 internationals.'),
  ('Women''s One Day International', 'WODI', 'wodi', 'Women''s one-day internationals.')
on conflict (slug) do nothing;
