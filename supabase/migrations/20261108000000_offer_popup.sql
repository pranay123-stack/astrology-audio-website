-- An offer popup (e.g. Diwali or BBL offers) edited in Admin › Home and shown once to each visitor.
alter table public.site_content drop constraint site_content_key_check;
alter table public.site_content add constraint site_content_key_check check (key in ('rules', 'krishna', 'quotes', 'popup'));
