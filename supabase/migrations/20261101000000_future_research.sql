-- Future Research Topics (menu item 9): football, the share market, bitcoin & forex, and
-- lottery numbers. Each has its own category so the astrologer can post research as it comes.
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Football Astro', 'फ़ुटबॉल ज्योतिष', 'football-astro', 'general', 30, false,
   'Astrology research on football matches.', 'फ़ुटबॉल मैचों पर ज्योतिषीय शोध।'),
  ('Share Market', 'शेयर बाज़ार', 'share-market', 'general', 31, false,
   'Astrology research on the share market.', 'शेयर बाज़ार पर ज्योतिषीय शोध।'),
  ('Bitcoin & Forex Market', 'बिटकॉइन और फ़ॉरेक्स बाज़ार', 'bitcoin-forex', 'general', 32, false,
   'Astrology research on bitcoin and forex markets.', 'बिटकॉइन और फ़ॉरेक्स बाज़ार पर ज्योतिषीय शोध।'),
  ('Lottery Number', 'लॉटरी नंबर', 'lottery-number', 'general', 33, false,
   'Astrology research on lottery numbers.', 'लॉटरी नंबरों पर ज्योतिषीय शोध।')
on conflict (slug) do nothing;
