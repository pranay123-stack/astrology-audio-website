-- Menu: "Prediction Records" (new) and "Testimonials", each by league (BBL, IPL).
--
-- * Prediction Records: audio with the match data. The old "Testimonial Audio" category (match
--   required) becomes "Prediction Records"; the league comes from each post's match.
-- * Testimonials: message proof only, a category per league. The single "Message Proof"
--   category becomes the BBL one.
-- Posts in a renamed category stay with it.
update public.categories
   set slug = 'prediction-records', name = 'Prediction Records', name_hi = 'भविष्यवाणी रिकॉर्ड',
       description = 'Match predictions with audio and the match data.', description_hi = 'ऑडियो और मैच डेटा के साथ मैच की भविष्यवाणियाँ।'
 where slug = 'testimonial-audio';

update public.categories
   set slug = 'testimonial-messages-bbl', name = 'Message Proof (BBL)', name_hi = 'संदेश प्रमाण (BBL)',
       description = 'Screenshots of messages about BBL readings.', description_hi = 'BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'
 where slug = 'testimonial-messages';

insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Prediction Records', 'भविष्यवाणी रिकॉर्ड', 'prediction-records', 'cricket', 13, true,
   'Match predictions with audio and the match data.', 'ऑडियो और मैच डेटा के साथ मैच की भविष्यवाणियाँ।'),
  ('Message Proof (BBL)', 'संदेश प्रमाण (BBL)', 'testimonial-messages-bbl', 'cricket', 14, false,
   'Screenshots of messages about BBL readings.', 'BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (IPL)', 'संदेश प्रमाण (IPL)', 'testimonial-messages-ipl', 'cricket', 15, false,
   'Screenshots of messages about IPL readings.', 'IPL रीडिंग पर आए संदेशों के स्क्रीनशॉट।')
on conflict (slug) do nothing;
