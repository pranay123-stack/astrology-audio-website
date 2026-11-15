-- Latest Matches › Course Teaching: teaching posts, one per match (match details + its KP chart),
-- listed in the order they were posted (lesson 1 first).
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Course Teaching', 'कोर्स टीचिंग', 'course-teaching', 'cricket', 17, true,
   'Teaching lessons: a cricket match with its details and its KP chart, in course order.',
   'टीचिंग पाठ: हर पाठ में एक क्रिकेट मैच, उसका विवरण और उसकी KP कुंडली, कोर्स के क्रम में।')
on conflict (slug) do nothing;
