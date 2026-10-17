# Astrology Audio Website

A website for an astrologer who publishes **Big Bash League cricket astrology readings** and **general astrology audio**. Visitors browse and listen; the astrologer manages everything from a protected `/admin` area without touching code.

- **Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage), Zod, React Hook Form, Lucide icons.
- **Two data backends behind one interface:**
  - **Supabase** for production.
  - **Local mode** (a JSON file plus files on disk) so the site runs with no accounts or credentials. Local mode is for development and demos only.
- **Sample content:** everything seeded is clearly marked “Sample”, using fictional “Demo Team” fixtures and placeholder audio tones. A site-wide banner says so until the admin removes it with one click.

---

## Contents

1. [Quick start (local mode)](#quick-start-local-mode)
2. [Supabase setup](#supabase-setup)
3. [Environment variables](#environment-variables)
4. [Database design](#database-design)
5. [Uploading audio](#uploading-audio)
6. [Deployment (GitHub → Hostinger)](#deployment-github--hostinger)
7. [Testing](#testing)
8. [Security model](#security-model)
9. [Project structure](#project-structure)
10. [Feature checklist](#feature-checklist-implemented--tested--pending)
11. [Known limitations](#known-limitations)

---

## Quick start (local mode)

Requires **Node.js 22+** (`nvm use` reads `.nvmrc`). supabase-js needs Node 22's built-in WebSocket.

```bash
npm install
npm run setup:local -- --email you@example.com   # writes .env.local, prints a generated admin password once
npm run seed                                     # creates .data/ with reference data and sample episodes
npm run dev                                      # http://localhost:3460
```

Sign in at <http://localhost:3460/admin> with the printed password. To start over, run `npm run seed -- --reset`. To seed without the sample episodes, run `npm run seed -- --reset --no-demo`.

In local mode, data lives in `.data/db.json` and uploads in `.data/storage/`. Both are git-ignored.

---

## Supabase setup

### Option A: hosted Supabase project (production)

Follow **[docs/DEPLOYMENT.md § 3](docs/DEPLOYMENT.md#3-supabase-production-backend)**:

1. Create the project and apply the migration.
2. Turn off public sign-up.
3. Seed the reference data and create the first admin from your computer, using a separate git-ignored secrets file (`npx tsx --env-file=.env.production.secrets …`).

In Supabase mode the seed **never** adds the sample episodes unless you pass `--demo`. The Free plan caps uploads at **50 MB per file**.

### Option B: local Supabase (Docker)

```bash
npm run db:start            # starts Postgres, Auth, Storage and the API gateway, then applies the migration
npx --yes supabase@2.120.0 status   # prints API URL, anon key and service-role key
# put those in .env.local with NEXT_PUBLIC_DATA_BACKEND=supabase, then:
npm run seed -- --demo && npm run admin:create -- --email you@example.com
npm run dev
```

`supabase/config.toml` already disables public sign-up and sets the site URL to `http://localhost:3460`. Use `npm run db:reset` to re-apply the migration from scratch, then re-seed and re-create the admin.

---

## Environment variables

All variables are documented in [`.env.example`](.env.example). `NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing them.

| Variable | Needed in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_NAME` | both | Brand name in the header, titles and OG image |
| `NEXT_PUBLIC_SITE_URL` | both | Canonical URLs, sitemap, Open Graph (no trailing slash) |
| `NEXT_PUBLIC_SITE_TIMEZONE` | both | Timezone for match times and dates (default `Asia/Kolkata`, IST) |
| `NEXT_PUBLIC_NOINDEX` | both | `true` hides the whole site from search engines; use on temporary test deployments only |
| `NEXT_PUBLIC_DATA_BACKEND` | both | `supabase` or `local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Anon/publishable key (browser-safe; RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **Server only.** Signs media URLs and upload URLs, stores contact messages |
| `SESSION_SECRET` | local | ≥32 random characters; signs the admin session cookie |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | local | Admin login; the hash comes from `npm run admin:hash -- '<password>'` |
| `MAX_AUDIO_UPLOAD_MB` / `MAX_IMAGE_UPLOAD_MB` | both | Server-side upload limits (defaults 200 / 5) |
| `NEXT_PUBLIC_MAX_AUDIO_UPLOAD_MB` | both | Same limit, checked in the browser before uploading |
| `PREMIUM_ENABLED` | both | Keep `false` until payments exist (see below) |

No secret is hardcoded anywhere. The repository contains no keys.

---

## Database design

The full schema is in [`supabase/migrations/20261009000000_initial_schema.sql`](supabase/migrations/20261009000000_initial_schema.sql).

| Table | Purpose |
|---|---|
| `profiles` | The astrologer's public profile (single row): name, biography, experience, specialisations, photo, contact details, social links, legal business name and jurisdiction |
| `categories` | `Cricket Astrology` (section `cricket`) and the seven general categories (section `general`) |
| `competitions` | Leagues. The BBL is seeded; admins add others, such as the IPL, from **Admin → Leagues & teams**, with no code changes |
| `teams` | Teams per competition: name, short code, colour, optional logo |
| `episodes` | Title, slug, excerpt, description, category, audio and cover paths, duration, `is_published`, `is_premium`, `is_demo`, `play_count`, `published_at`, timestamps |
| `cricket_matches` | One row per cricket episode: competition, team A and B, `match_date`, venue, `match_status` |
| `contact_messages` | Contact form submissions (admin-only) |
| `purchases` | Premium module: per-episode purchases or subscriptions, written only by the server |
| `admins` | Users allowed into `/admin` |

Differences from the brief:

- `cricket_matches` references `competitions` and `teams` by ID rather than storing free-text names, so leagues and teams are managed once and reused.
- `episodes` gains `excerpt` (for cards), `audio_mime_type`, `is_demo` and `play_count` (used for “Popular audios”).

**Integrity rules enforced in the database:**

- Unique slugs.
- A published episode must have audio and a publication date.
- The two teams in a match must differ and must belong to the match's competition (trigger).
- Each episode and its match row are saved together in one transaction (`admin_save_episode`).

**Row Level Security:**

- Visitors can read only episodes that are published and whose `published_at` has passed (and the matching match rows).
- Visitors can never read drafts, contact messages, purchases or the admin list.
- Only admins (`public.is_admin()`) can write.
- `increment_play_count` is the only function visitors may call, and it only counts live episodes.
- The `episode_listings` view is `security_invoker`, so the same RLS policies apply through it.

---

## Uploading audio

**Admin → New episode:**

1. Enter the title (the URL slug fills in automatically), category, short description and optional notes.
2. For **Cricket Astrology**, a *Match information* section appears. Choose the competition, team A, team B, the start time (entered in the site timezone), venue and status.
3. **Audio file:** MP3, M4A, AAC, OGG or WAV.
   - The browser reads the duration and fills it in. You can override it.
   - The file uploads with a progress bar.
   - A preview player appears so you can listen before publishing.
4. **Cover image:** JPG, PNG, WebP or AVIF, up to 5 MB, ideally square.
5. Tick **Premium** if needed. Tick **Published** to go live. Leave the publication date empty to publish now; a future date schedules the episode.
6. **Save.** Drafts stay invisible to the public. The admin can preview a draft's audio from the edit page.

**How an upload works:**

1. The browser asks `/api/admin/uploads` for a one-time target. The server checks the admin session, the file type and the file size.
2. The browser sends the file straight to Supabase Storage through a signed upload URL (or, in local mode, to a signed local endpoint).
3. Large files never pass through the web server, so hosting request-size limits don't apply.
4. When the episode is saved, the server reads the file's first bytes and rejects it if they don't match the declared type. For example, a renamed `.exe` cannot be published as `.mp3`.
5. When audio or cover art is replaced or an episode is deleted, the old file is deleted once nothing references it.

**Other admin pages:**

- **Profile:** biography, photo, contact details, socials, legal details.
- **Leagues & teams:** add a competition such as the IPL, add or edit teams and logos.
- **Messages:** the contact-form inbox.
- **Dashboard:** counts per status and category, plus a “Remove sample content” button.

---

## Deployment (GitHub → Hostinger)

The full step-by-step guide is in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. It covers:

- Supabase project setup
- the GitHub private repository
- Hostinger plan choice and Node.js app settings
- environment variables
- custom domain, DNS and HTTPS
- post-deploy smoke tests, rollback and troubleshooting

The launch status is tracked in **[docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md)**.

In short, the app is a **Node.js server** (not a static site) and needs:

- Node.js 22
- `npm run build`, then `npm run start` (which listens on `PORT`)
- every `NEXT_PUBLIC_*` variable present at **build** time
- `SUPABASE_SERVICE_ROLE_KEY` at run time

In production it refuses to start if misconfigured; the log shows `[config]` messages explaining why. `GET /api/health` reports database reachability.

Local mode stores data on the server's disk, which hosting redeploys can wipe, so production must use Supabase.

To try a production build locally in local mode, run `npm run build && npm run start:local`. `setup:local` adds `ALLOW_LOCAL_BACKEND_IN_PRODUCTION=true` for this; never set it on a host.

---

## Testing

| Command | What it covers | Result at handover |
|---|---|---|
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint (Next.js core-web-vitals) | clean |
| `npm test` | 63 unit tests: session token signing and tampering, scrypt passwords, HTTP Range parsing, file-signature sniffing (disguised files), access rules, timezone/DST maths, slugs, validation, query parsing, the launch checklist, and the local repository (visibility, filters, search, sorting, transactions, concurrency, referential rules) | 63/63 pass |
| `npm run test:supabase` | 13 tests run against a real **local** Supabase: RLS for visitors, signed-in non-admins and admins; storage privacy; atomic save rollback; DB constraints; sign-up disabled | 13/13 pass |
| `npm run test:e2e` (seeds, builds, then tests) | 15 Playwright tests in Chromium against a production build in **local mode** | 15/15 pass |
| `npm run test:e2e:supabase` | Resets and seeds the **local** Supabase (refuses to run against a remote one), builds in Supabase mode, then runs the same 15 browser tests plus the 13 RLS tests | 15/15 + 13/13 pass |

The browser tests check:

- Real audio playback: `currentTime` advances, and the duration matches the file.
- The mini-player keeps playing across page navigation.
- 1.5× speed and seeking.
- The error message when an audio file is missing.
- Premium audio is locked in the UI **and** refused by the server (403).
- Search and filters, and the upcoming/past match split.
- The mobile menu.
- The contact form reaching the admin inbox.
- Admin login: wrong password, sign-out.
- Uploading real and disguised files.
- Draft preview (admin 206, visitor 404).
- Publish, unpublish and delete.
- Cricket match validation.
- Profile edits appearing publicly.
- Removing the sample content.

---

## Security model

- **Premium audio is protected server-side.**
  - `/api/media/audio/[id]` decides access on every request (`src/lib/access.ts`). Drafts and scheduled episodes return 404 to visitors.
  - Premium audio returns 403 while `PREMIUM_ENABLED=false`, and after that unless the listener is entitled.
  - Audio is never addressed by its storage path. In Supabase mode the route redirects to a signed URL that expires after 5 minutes for premium audio and 1 hour for free audio. The `audio` bucket is private.
- **Admin access is checked in depth.**
  - The `/admin` layout gates the UI.
  - Every admin page and server action calls `requireAdmin()` itself.
  - Admin route handlers also check that the request comes from the same origin.
  - In Supabase mode, RLS enforces the same rules a second time inside the database.
- **Local-mode sessions:**
  - The session cookie is HMAC-signed, `httpOnly` and `SameSite=Lax`, and `Secure` in production. It lasts 12 hours.
  - Passwords are stored as scrypt hashes.
  - Login attempts are limited to 10 per 15 minutes per IP.
- **Contact form:** validated with Zod, protected by a honeypot field, limited to 5 messages per hour per IP, and stored only by the server.
- **Uploads:** checked for type and size before upload, by the bucket's own limits, and by the file signature after upload. Storage paths are random UUIDs that are never reused.
- **Headers:** `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` are set site-wide. `/admin` and `/api` are excluded in `robots.txt` and marked `noindex`.

---

## Project structure

```
src/
  app/(site)/          public pages: home, cricket-astrology, astrology-audios, premium, about, contact, legal
  app/admin/           login, (panel)/ dashboard, episodes, leagues, profile, messages; actions.ts (server actions)
  app/api/             media/audio (access-checked streaming), media/image (local mode), episodes/[id]/play, admin/uploads
  components/audio/    AudioPlayerProvider (one site-wide <audio>), MiniPlayer, EpisodePlayer, PlayButton
  components/episodes/ cards, match card, team badge, episode detail
  components/admin/    EpisodeForm, ProfileForm, LeaguesManager, FileField (uploads)
  lib/data/            Repository interface, local JSON implementation, Supabase implementation
  lib/media/           storage (uploads, verification, streaming), file-type sniffing, Range parsing
  lib/auth/            admin session (both backends), token signing, password hashing
  lib/queries.ts       cached public reads ('use cache' + cacheTag; admin edits call updateTag)
supabase/              config.toml and the migration
scripts/               seed, setup-local, admin:create, admin:hash
seed/                  sample content definitions and three placeholder audio tones
tests/unit, tests/supabase, tests/e2e
```

---

## Feature checklist (implemented / tested / pending)

**Implemented and covered by automated tests**

- [x] Responsive dark navy, purple and gold design. Checked at 1440 px and 390 px with no horizontal overflow.
- [x] Header navigation with a mobile menu; footer with navigation, contact details, socials (when set), legal links and a disclaimer line.
- [x] Homepage:
  - hero led by the next BBL match prediction (teams, live countdown, play button), with a cricket-ball zodiac wheel
  - featured audio
  - BBL readings (upcoming first)
  - category browser
  - about-the-astrologer section
  - call to action
- [x] HTML5 audio player:
  - play/pause, seek, current and total time, volume/mute, speed (0.75–2×), skip ±15 s
  - cover art, title and category
  - persistent mini-player across navigation
  - lock-screen controls (Media Session)
  - helpful error messages
- [x] `/cricket-astrology`:
  - BBL banner, upcoming/past/all tabs
  - search by team or title
  - filters for competition, date range and free/premium
  - Load more, detail pages with the player and match details, related readings
  - astrology-vs-statistics disclaimer
- [x] Multi-league data model (competitions and teams tables, admin UI). Adding the IPL needs no code.
- [x] `/astrology-audios`:
  - category chips, keyword search, free/premium filter
  - latest and popular (by play count)
  - Load more, detail pages, related audios
- [x] Articles: a post can have audio, a written article (Hindi or English), or both. Light formatting (paragraphs, `##` headings, `-` bullets, `**bold**`), admin preview, Devanagari fonts, `lang` set for accessibility, article text searchable. Premium article text is stored in a separate RLS-protected table, so visitors can never read it, not even through the public API.
- [x] Premium labels and locked players that send visitors to the astrologer ("Contact for full package", contact form pre-filled with the episode), with server-side refusal of premium audio.
- [x] Admin:
  - secure login
  - upload audio and cover with progress
  - add, edit, publish, unpublish, schedule and delete episodes
  - cricket match fields, free/premium, preview before publishing
  - profile and contact editor, leagues and teams, contact inbox
  - dashboard with counts per status and category
- [x] File type and size validation (client, server, bucket, and byte signature).
- [x] Supabase schema with foreign keys, indexes, constraints and RLS; private audio and public image buckets.
- [x] SEO and accessibility:
  - per-page metadata and Open Graph, sitemap.xml (sample episodes excluded), robots.txt
  - `PodcastEpisode` JSON-LD on real episodes only (never on samples)
  - optimised and lazy-loaded images
  - semantic HTML, skip link, labelled controls, `prefers-reduced-motion`
  - loading, empty and error states
- [x] Disclaimer, privacy and terms pages, with business details editable from the admin. Highlighted placeholders show until they are filled in.
- [x] Clearly labelled sample content that can be removed with one click.

**Implemented, checked by hand only**

- [x] Visual design at desktop and mobile widths (screenshots reviewed).
- [x] Open Graph image generation (`/opengraph-image` returns a PNG).

**Pending: needs decisions or credentials from the business owner**

- [ ] **Payments and subscriptions.** The schema (`purchases`), the entitlement function (`has_premium_access`) and the server-side gate are ready. Still to build once pricing and a provider (e.g. Stripe) are chosen:
  - customer registration and login
  - checkout
  - a webhook that writes `purchases` with the service role
  - a purchase-history page
  - setting `PREMIUM_ENABLED=true`

  Until then there is no Login button for visitors, and premium audio cannot be played by anyone except admins.
- [ ] **Real content:**
  - the astrologer's name, photo, biography and credentials (only verifiable ones)
  - contact details, social links, legal business name and jurisdiction
  - real episodes, then remove the sample content
- [ ] **Team logos:** none are bundled because club logos are trademarks. Upload licensed logos in *Leagues & teams*; otherwise a monogram in the club colour is shown.
- [ ] **Legal review** of the privacy, terms and disclaimer templates for the business's jurisdiction.
- [ ] **Email notification** for new contact messages. Messages are stored in the admin inbox; sending email needs an email provider and its credentials.
- [ ] Production deployment (needs the hosted Supabase project and a domain).

---

## Known limitations

- **Soft 404s for unknown episode URLs.** Episode pages stream (Next.js Partial Prerendering), so an unknown slug renders the 404 page with `noindex` but HTTP status 200.
- **Time-based changes can lag by a minute.** Public pages are cached and refreshed immediately after admin edits. Changes that depend only on the clock (a scheduled episode going live, a match moving from upcoming to past) can take up to about a minute to appear.
- **Approximate play counts.** “Popular” uses a best-effort counter, limited per IP, counting one play per page session.
- **Single-instance rate limits.** Login and contact limits are kept in memory per server instance. Supabase Auth applies its own login limits in Supabase mode.
