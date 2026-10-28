-- Testimonials (menu item 8): audio testimonials with the match they are about, and screenshots
-- of messages as proof (posted as photos).
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Testimonial Audio', 'प्रशंसापत्र ऑडियो', 'testimonial-audio', 'cricket', 13, true,
   'Audio testimonials with the cricket match data.', 'क्रिकेट मैच डेटा के साथ ऑडियो प्रशंसापत्र।'),
  ('Message Proof', 'संदेश प्रमाण', 'testimonial-messages', 'cricket', 14, false,
   'Screenshots of messages from people who followed the readings.', 'रीडिंग पर भरोसा करने वालों के संदेशों के स्क्रीनशॉट।')
on conflict (slug) do nothing;
