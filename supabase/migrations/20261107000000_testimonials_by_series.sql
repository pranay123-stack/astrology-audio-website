-- Testimonials follow Cricket Matches › BBL, IPL, T20, ODI › Men, Women. Message proof has no
-- match to say where it belongs, so each place has a category. The BBL and IPL ones keep their
-- posts and become the men's.
update public.categories set name = 'Message Proof (BBL Men)', name_hi = 'संदेश प्रमाण (BBL पुरुष)' where slug = 'testimonial-messages-bbl';
update public.categories set name = 'Message Proof (IPL Men)', name_hi = 'संदेश प्रमाण (IPL पुरुष)' where slug = 'testimonial-messages-ipl';

insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Message Proof (BBL Women)', 'संदेश प्रमाण (BBL महिला)', 'testimonial-messages-wbbl', 'cricket', 15, false,
   'Screenshots of messages about women''s BBL readings.', 'महिला BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (IPL Women)', 'संदेश प्रमाण (IPL महिला)', 'testimonial-messages-wpl', 'cricket', 15, false,
   'Screenshots of messages about women''s IPL readings.', 'महिला IPL रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (T20 Men)', 'संदेश प्रमाण (T20 पुरुष)', 'testimonial-messages-t20i', 'cricket', 15, false,
   'Screenshots of messages about men''s T20 readings.', 'पुरुष T20 रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (T20 Women)', 'संदेश प्रमाण (T20 महिला)', 'testimonial-messages-wt20i', 'cricket', 15, false,
   'Screenshots of messages about women''s T20 readings.', 'महिला T20 रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (ODI Men)', 'संदेश प्रमाण (ODI पुरुष)', 'testimonial-messages-odi', 'cricket', 15, false,
   'Screenshots of messages about men''s ODI readings.', 'पुरुष ODI रीडिंग पर आए संदेशों के स्क्रीनशॉट।'),
  ('Message Proof (ODI Women)', 'संदेश प्रमाण (ODI महिला)', 'testimonial-messages-wodi', 'cricket', 15, false,
   'Screenshots of messages about women''s ODI readings.', 'महिला ODI रीडिंग पर आए संदेशों के स्क्रीनशॉट।')
on conflict (slug) do nothing;
