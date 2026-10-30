-- Testimonials are grouped by league (BBL, IPL), each with audio and message proof. Audio
-- testimonials already carry their match, so the league comes from it; message proof gets a
-- category per league. The single Message Proof category becomes the BBL one (its posts, if
-- any, stay with it).
update public.categories
   set slug = 'testimonial-messages-bbl', name = 'Message Proof (BBL)', name_hi = 'संदेश प्रमाण (BBL)',
       description = 'Screenshots of messages about BBL readings.', description_hi = 'BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'
 where slug = 'testimonial-messages';

insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Message Proof (BBL)', 'संदेश प्रमाण (BBL)', 'testimonial-messages-bbl', 'cricket', 14, false,
   'Screenshots of messages about BBL readings.', 'BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (IPL)', 'संदेश प्रमाण (IPL)', 'testimonial-messages-ipl', 'cricket', 15, false,
   'Screenshots of messages about IPL readings.', 'IPL रीडिंग पर आए संदेशों के स्क्रीनशॉट।')
on conflict (slug) do nothing;
