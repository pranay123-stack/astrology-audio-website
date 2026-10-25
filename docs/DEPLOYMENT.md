# Deployment guide: GitHub → Hostinger, with Supabase

This guide takes the site from this repository to a live custom domain. It is written for this project specifically. Steps marked **(you)** need an account, a payment or a DNS change, which only the owner can authorise.

> **Status when this guide was written (9 Oct 2026):** everything has been verified locally against a local Supabase stack (see [Testing](../README.md#testing)). Nothing has been deployed to Hostinger or to a hosted Supabase project yet. The Hostinger-specific steps are based on Hostinger's documentation and have **not been tested on a real Hostinger account**. Items to confirm are marked ⚠️.

---

## 1. What the application needs from a host

| Requirement | Why |
|---|---|
| A **Node.js server** (not static hosting) | Server rendering, route handlers (`/api/media/audio`, `/api/admin/uploads`, `/api/health`), server actions (admin and contact form) and the proxy (Supabase session refresh) all need a running Node.js process. `output: "export"` (static) would break the admin, audio protection and contact form. |
| **Node.js 22** | supabase-js needs Node 22's built-in WebSocket; `package.json` → `engines.node >= 22`. |
| `npm ci` → `npm run build` → `npm run start` | Standard Next.js. `npm start` runs `next start`, which listens on the **`PORT`** environment variable (default 3000). |
| Environment variables at **build time** | `NEXT_PUBLIC_*` values are baked into the build. The build also prerenders pages, so it must reach Supabase over the network. |
| `SUPABASE_SERVICE_ROLE_KEY` at **run time** | Server-only secret used for audio delivery, uploads and the contact form. |
| No persistent disk | In Supabase mode, all data and uploads live in Supabase. The app writes only Next.js's own cache under `.next/`, which is safe to lose on redeploy. |
| No WebSockets, cron or background workers | None are used. |

**Safety net:** in production the server refuses to start (exit code 1, `[config]` messages in the log) if it would otherwise run on local-file storage, if the build and runtime disagree on the backend, if the service-role key is missing, or if the service-role key is the same as the anon key. `GET /api/health` returns `200 {"status":"ok"}` when the database is reachable and `503` when it isn't.

## 2. Choosing a Hostinger plan

According to Hostinger's documentation, Node.js web apps (including Next.js with GitHub deployment) are available on **Business Web Hosting** and the **Cloud** plans (Startup, Professional, Enterprise, Enterprise Plus), with Node.js 18/20/22/24 selectable. They are also available on VPS with manual setup. Entry-level shared plans do not include Node.js apps.

- **Recommended:** Business, or Cloud Startup for more headroom (4 CPU cores, 4 GB RAM according to the plan page). This site is light; Business should be enough to launch.
- ⚠️ **Before paying:** Hostinger's plan names vary between pages (the Next.js page currently lists "Unlimited" and "Cloud Startup"). Make sure the plan you buy explicitly lists **Node.js / Web Apps**.
- Prices shown are introductory. Check the **renewal** price.

Sources: [Hostinger: How to add a Node.js web app](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [Hostinger Next.js hosting](https://www.hostinger.com/web-apps-hosting/nextjs-hosting).

## 3. Supabase (production backend)

1. **(you)** Create a project at <https://supabase.com>.
   - Pick the region closest to most listeners: `ap-southeast-2` (Sydney) for an Australian/BBL audience, or `ap-south-1` (Mumbai) for India.
   - Save the database password in a password manager.
2. **Apply the schema.** Use one of:
   - **SQL editor:** paste `supabase/migrations/20261009000000_initial_schema.sql` and run it once.
   - **CLI:** `npx --yes supabase@2.120.0 login`, then `npx --yes supabase@2.120.0 link --project-ref <ref>`, then `npx --yes supabase@2.120.0 db push`.

   Apply **every** file in `supabase/migrations/` in name order: `20261009000000_initial_schema.sql`, then `20261017000000_articles.sql` (articles + the "Planets (Grahas)" category). `db push` applies any missing ones automatically.

   This creates all tables, RLS policies, functions, the `episode_listings` view and the two storage buckets: `audio` (private, 200 MB/file) and `images` (public, 5 MB/file).
3. **Authentication** → *Sign In / Providers*:
   - Turn **off** "Allow new users to sign up".
   - Keep **Email** enabled; the admin signs in with email and password.
   - Under *URL Configuration*, set **Site URL** to the temporary Hostinger URL now, and to `https://your-domain` later.

   The site uses only email and password login, so no OAuth redirect URLs are needed.
4. **Storage upload limit:** the Free plan accepts files up to **50 MB**. Export audio at 64–96 kbps mono/stereo MP3; one hour at 64 kbps is about 29 MB. On a paid plan you can raise the global limit (*Storage → Settings*) and `MAX_AUDIO_UPLOAD_MB` / `NEXT_PUBLIC_MAX_AUDIO_UPLOAD_MB`.
5. **Copy the keys** (*Project Settings → API*):
   - Project URL
   - `anon` / publishable key (browser-safe)
   - `service_role` / secret key (**server only**)
6. **Seed reference data and create the admin** from your own computer. Keep the production secrets in a separate git-ignored file, never in `.env.local`:

   ```bash
   cat > .env.production.secrets <<'EOF'
   NEXT_PUBLIC_DATA_BACKEND=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   EOF
   npx tsx --env-file=.env.production.secrets scripts/seed.ts                                  # categories, BBL + 8 clubs, placeholder profile. NO sample episodes.
   npx tsx --env-file=.env.production.secrets scripts/create-admin.ts --email you@example.com   # prints a generated password once
   ```

   - In Supabase mode the seed **never** adds the sample episodes unless you pass `--demo`.
   - Re-running the seed is safe: it upserts reference data and never overwrites an edited profile.
   - Delete `.env.production.secrets` afterwards, or keep it only in a password manager.
7. **Free-plan caveats:**
   - Supabase may pause free projects after a period of inactivity.
   - The Free plan has no automated backups.
   - For a business site, consider the Pro plan once it launches.

## 4. GitHub

The code is in the **private** repository <https://github.com/pranay123-stack/astrology-audio-website> (branch `main`). The steps below are for reference, or for recreating it elsewhere.

**Before committing, check:**

```bash
git status --short                 # .env.local, .data/, .next/, node_modules/ must NOT appear
git check-ignore -v .env.local .data .next node_modules   # each line should print the matching .gitignore rule
```

**(you) Create a private repository and push** (with the GitHub CLI):

```bash
git add -A
git commit -m "Astrology audio website: production-ready build"
gh repo create astrology-audio-website --private --source=. --remote=origin --push
```

Without the GitHub CLI: create an empty **private** repository on github.com, then run:

```bash
git remote add origin git@github.com:<you>/astrology-audio-website.git
git branch -M main
git push -u origin main
```

## 5. Deploy on Hostinger

**(you)** In hPanel → *Websites* → *Add website* → **Node.js Apps / Web app** → **Import Git repository**:

1. Connect GitHub and allow access to the private repository. Choose the `main` branch.
2. **Framework:** Next.js (it should be detected automatically). **Node.js version: 22.x.**
3. **Build command:** `npm run build`.
   **Start command:** `npm run start`.
   **Output directory** (if asked): `.next`.
4. **Environment variables.** Add all of these. ⚠️ Confirm they apply to **both the build and the running app**; the build needs the `NEXT_PUBLIC_*` values.

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_DATA_BACKEND` | `supabase` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key (**secret**) |
   | `NEXT_PUBLIC_SITE_URL` | the temporary Hostinger URL first, `https://your-domain` after step 6 |
   | `NEXT_PUBLIC_SITE_NAME` | `Astro Cricket` |
   | `NEXT_PUBLIC_SITE_TIMEZONE` | `Asia/Kolkata` (default; IST) |
   | `NEXT_PUBLIC_SITE_LOCALE` | `en-IN` (default) |
   | `MAX_AUDIO_UPLOAD_MB`, `NEXT_PUBLIC_MAX_AUDIO_UPLOAD_MB` | `50` on the Supabase Free plan |
   | `MAX_VIDEO_UPLOAD_MB`, `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB` | `50` (optional; that is the default) |
   | `PREMIUM_ENABLED` | `false` |

   - Do **not** set `ALLOW_LOCAL_BACKEND_IN_PRODUCTION`, `SESSION_SECRET`, `ADMIN_*` or `LOCAL_DATA_DIR` on the host. They are for local mode only.
   - ⚠️ Hostinger also offers a "database wizard" for Supabase that adds variables automatically. Check that the names it creates match the table above; add any that are missing.
5. **Deploy**, then open the temporary URL's `/api/health`. Expected result: `{"status":"ok","backend":"supabase","database":"ok",…}`. If the deployment fails or the site returns errors, open the app's **runtime logs** and look for lines starting with `[config]` (see [Troubleshooting](#9-troubleshooting)).
6. ⚠️ **Port:** the app listens on `PORT` (default 3000). If Hostinger's logs show it waiting on a different port, set `PORT` to the value Hostinger specifies.

**Every `git push` to `main` triggers a new build and deploy.** Manual edits through File Manager or FTP do not persist; change the repository and redeploy instead. Changing any `NEXT_PUBLIC_*` value needs a **redeploy** (a rebuild), not just a restart.

**If GitHub deployment is unavailable** on your plan, use Hostinger's **ZIP upload**. Create the archive from the repository so secrets and local data are excluded, then upload it with the same settings and variables:

```bash
git archive --format=zip -o astrology-site.zip HEAD
```

## 5a. Optional: temporary test deployment on Vercel

To try the site for a few days before buying hosting:

1. On vercel.com, sign in with GitHub, then **Add New → Project** and import the repository.
2. Add the same environment variables as in § 5 step 4. Add **`NEXT_PUBLIC_NOINDEX=true`** too, so search engines don't index the temporary `*.vercel.app` address.
3. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the `*.vercel.app` URL and redeploy.

Notes:
- Vercel's free Hobby plan is for **non-commercial** use, which is fine for private testing. Launch on Hostinger, or on a paid Vercel plan.
- Vercel runs several instances of the app, so an admin edit can take up to about a minute to show for every visitor.
- At launch, **do not** set `NEXT_PUBLIC_NOINDEX` on the real host. The server logs a `[config]` warning while it is on.

## 6. Custom domain and HTTPS

1. **(you)** Buy the domain (Hostinger, Cloudflare, Porkbun, etc.). Turn on auto-renew and WHOIS privacy.
2. **(you)** In hPanel, connect the domain to the web app (*Domains* / *Connect domain* on the app).
   - **Bought at Hostinger:** DNS is usually configured automatically.
   - **Bought elsewhere:** either point the domain's **nameservers** to the ones hPanel shows, or add the **A / CNAME records** hPanel shows at your registrar. Use exactly the values hPanel displays; this guide deliberately does not list any, because they are account-specific.
   - Decide on `www`: hPanel shows how to point `www` (usually a CNAME) and lets you redirect one form to the other. Pick one canonical form and use it in `NEXT_PUBLIC_SITE_URL`.
3. **Verify DNS** (propagation can take from minutes to 48 hours):

   ```bash
   dig +short your-domain.com A
   dig +short www.your-domain.com
   ```

   The answers should match what hPanel expects.
4. **HTTPS:** Hostinger issues a free SSL certificate once DNS resolves. Check:

   ```bash
   curl -sI https://your-domain.com | head -1          # HTTP/2 200
   curl -sI http://your-domain.com | grep -i location   # should redirect to https
   ```

5. Update **`NEXT_PUBLIC_SITE_URL=https://your-domain.com`** in Hostinger and **redeploy**. Canonical URLs, the sitemap, robots.txt and Open Graph tags are generated from this value. Then set the same URL as **Site URL** in Supabase → Authentication → URL Configuration.
6. **Check SEO output:**

   ```bash
   curl -s https://your-domain.com/robots.txt
   curl -s https://your-domain.com/sitemap.xml | head
   curl -s https://your-domain.com/ | grep -o '<link rel="canonical"[^>]*>'
   ```

   Every URL in these should use `https://your-domain.com`.

## 7. Post-deployment smoke test (run on the live site)

1. `/api/health` returns `200` with `"database":"ok"`.
2. The homepage, Cricket Astrology, General Astrology, Premium, About, Contact and the three legal pages all load. No "Sample" banner appears.
3. **Admin:**
   - Sign in at `/admin` with the account from step 3.6.
   - A wrong password is rejected.
   - The dashboard shows the **"Before you launch"** checklist.
4. **Upload a short test episode** (MP3 plus cover) as a **draft**.
   - The preview player works.
   - The episode does **not** appear on the public site.
   - Publish it: it appears and plays. Audio is delivered through `/api/media/audio/<id>`, which redirects to a short-lived signed URL.
   - Unpublish it, then delete it.
5. **Premium:** mark a test episode premium and publish it.
   - The public page shows "Contact for full package".
   - `curl -s -o /dev/null -w '%{http_code}' https://your-domain.com/api/media/audio/<id>` returns `403`.
6. **Contact form:** send a message and confirm it arrives in Admin → Messages.
7. **Mobile:** open the site on a phone and check the menu, the player bar and playback across pages.
8. **Security:** `https://<ref>.supabase.co/storage/v1/object/public/audio/<any path>` must **not** download audio, because the bucket is private.

## 8. Rollback

- **Code:** `git revert <bad-commit>` and push. Hostinger rebuilds the previous code. Hostinger keeps the last two successful build versions; ⚠️ check whether hPanel offers a one-click redeploy of the previous version.
- **Database:** the schema is in versioned migrations. To change it, add a **new** migration; don't edit applied ones. On Supabase Pro, use daily backups or point-in-time recovery.
- **Content:** episodes can be unpublished instantly from the admin without deleting them.

## 9. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| App won't start; log shows `[config] … built in "local" mode` or `… local mode` | `NEXT_PUBLIC_*` variables were missing during the **build**. Add them, then redeploy so the app rebuilds. |
| `[config] SUPABASE_SERVICE_ROLE_KEY is not set` / `… same as the anon key` | Set the real service-role key in the app's environment variables. |
| Build fails while "Generating static pages" with a Supabase error | The build can't reach Supabase or a key is wrong. Check the URL and anon key, and that the migration was applied. |
| `/api/health` returns `503` | The database is unreachable: the project may be paused (Free plan), or the keys are wrong. |
| Cover images missing | Images must come from `https://<ref>.supabase.co/storage/v1/object/public/images/…`. A custom Supabase domain would need adding to `images.remotePatterns` in `next.config.ts`. |
| Upload fails with "too large" / HTTP 413 | The file exceeds the Supabase plan limit (50 MB on Free). Re-export at a lower bitrate or upgrade. |
| Admin login says "does not have administrator access" | The account exists but isn't in `public.admins`. Run `scripts/create-admin.ts` for it. |
| Admin login fails for a correct password | Check that Supabase Auth has the Email provider enabled. (Disabling "Allow new users to sign up" is correct; disabling the Email provider is not.) |
| Old content still shown after editing in the Supabase dashboard | Public pages are cached. Edits made in the admin refresh them immediately; edits made directly in Supabase show within about a minute. |
