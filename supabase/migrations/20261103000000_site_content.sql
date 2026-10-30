-- Text the astrologer edits in Admin that is not a post: the Rules page, the Krishna Consciousness
-- essay and the home page quote. A missing row means the text bundled with the site (src/content).
create table public.site_content (
  key text primary key check (key in ('rules', 'krishna', 'quotes')),
  value jsonb not null check (jsonb_typeof(value) = 'object' and pg_column_size(value) <= 200000),
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
create policy "site content is public" on public.site_content for select to anon, authenticated using (true);
create policy "admins manage site content" on public.site_content for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create trigger site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

-- Audio, video or other posts shown below the Rules and Krishna Consciousness text.
insert into public.categories (name, name_hi, slug, section, sort_order, requires_match, description, description_hi) values
  ('Rules', 'नियम', 'rules-posts', 'general', 34, false,
   'Audio and video about the rules.', 'नियमों पर ऑडियो और वीडियो।'),
  ('Krishna Consciousness', 'कृष्ण चेतना', 'krishna-consciousness', 'general', 35, false,
   'Audio and video on Krishna Consciousness.', 'कृष्ण चेतना पर ऑडियो और वीडियो।')
on conflict (slug) do nothing;
