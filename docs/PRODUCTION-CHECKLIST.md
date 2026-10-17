# Production-readiness checklist

Status labels:

- **Complete:** done and verified.
- **Pending:** ready to do, waiting on someone.
- **Blocked:** cannot start until something else is supplied.
- **Not Tested:** cannot be verified until the external service exists.

*Last updated: 9 October 2026.*

## Code and build

| Item | Status | Evidence |
|---|---|---|
| TypeScript (`npm run typecheck`) | Complete | 0 errors |
| Lint (`npm run lint`) | Complete | 0 errors, 0 warnings |
| Unit tests (`npm test`) | Complete | 63/63 pass |
| Browser tests, local mode (`npm run build && npm run test:e2e`), incl. admin-on-phone layout | Complete | 15/15 pass |
| Browser and database-policy tests, Supabase mode (`npm run test:e2e:supabase`, local Supabase) | Complete | 15/15 browser, 13/13 RLS pass |
| Clean deploy simulation: `npm ci` (with and without dev dependencies), build, start, health check, from the files git would commit | Complete | Build ✓, `/api/health` 200, sitemap uses the production URL |
| Production dependency audit (`npm audit --omit=dev`) | Complete | 0 vulnerabilities (one high-severity advisory in a dev-only tool, not shipped) |
| Startup guard against misconfiguration | Complete | Verified to exit with code 1 for: a local-mode build, a build/runtime backend mismatch, a missing service-role key, and a service-role key equal to the anon key |
| `/api/health` endpoint | Complete | 200 when the DB is reachable, 503 when not; no secrets in the response |

## Supabase

| Item | Status |
|---|---|
| Schema, constraints, indexes, RLS, storage buckets (migration) | Complete. Verified on local Supabase. |
| Function privileges hardened (visitors cannot call admin or entitlement functions) | Complete. Covered by RLS tests. |
| Public sign-up disabled, email login enabled (local `config.toml`) | Complete |
| Hosted project created | Complete: `astrology-audio`, Southeast Asia (Singapore, ap-southeast-1), Free plan |
| Migration applied to the hosted project | Complete: one transaction; recorded in `supabase_migrations` |
| Sign-up disabled in the hosted dashboard | Complete: verified, signup API returns `signup_disabled`; admin login still works |
| Supabase Site URL set to the live domain | Blocked (needs the domain) |
| Reference data seeded (no sample episodes), first admin created | Complete: 8 categories, BBL + 8 clubs; admin account created |
| RLS and storage behaviour on the hosted project | Complete: 13/13 RLS tests pass on the live project; test data cleaned up |
| App against the live project (local build): login, signed uploads, draft hidden, publish, playback, cover image, delete and cleanup | Complete |

## GitHub

| Item | Status |
|---|---|
| `.gitignore` excludes env files, local data, build output, test artefacts | Complete. Checked with `git check-ignore`. |
| `.env.example` with placeholders only | Complete |
| Secret scan of the files that would be committed | Complete. No keys found. |
| Work committed | Complete |
| Private repository created and pushed | Complete: [pranay123-stack/astrology-audio-website](https://github.com/pranay123-stack/astrology-audio-website) (private, `main`) |

## Hostinger

| Item | Status |
|---|---|
| App requirements identified (Node.js server, Node 22, build-time env, no persistent disk) | Complete |
| Start script honours `PORT` | Complete |
| Build works with production-only `npm ci` | Complete |
| Plan with Node.js Web Apps purchased | **Pending (owner)**. Business or Cloud plan; confirm it lists Node.js / Web Apps. |
| Env vars available at build time on Hostinger | Not Tested ⚠️ |
| First deployment and `/api/health` on the Hostinger URL | Not Tested |
| Auto-deploy on push | Not Tested |

## Domain and HTTPS

| Item | Status |
|---|---|
| Domain purchased | **Pending (owner)** |
| DNS records or nameservers set as shown in hPanel | Blocked (needs the plan and domain) |
| HTTPS certificate active, http→https redirect | Not Tested |
| `NEXT_PUBLIC_SITE_URL` set to the domain and redeployed; canonical URLs and sitemap checked | Blocked |
| Supabase Site URL updated to the domain | Blocked |

## Content: the astrologer must supply these

The admin dashboard's **"Before you launch"** panel tracks most of these live.

| Item | Status |
|---|---|
| Real brand / site name (`NEXT_PUBLIC_SITE_NAME`) | Complete: "Astro Cricket" (code default; set the same value on the host) |
| Astrologer's name, photograph and biography | **Pending** |
| Experience and specialisations (verifiable claims only; no accuracy rates or testimonials unless real) | **Pending** |
| Consultation and premium-package details | **Pending** |
| Contact email, phone, location, social links | **Pending** |
| Real episodes uploaded (sample content is never seeded in production) | **Pending** |
| Team logos (only if licensed; otherwise colour monograms are shown) | Optional |

## Legal

| Item | Status |
|---|---|
| Disclaimer: no guaranteed sporting outcomes, winnings or returns; not betting advice | Complete (template) |
| Business name and jurisdiction fields (fill the highlighted gaps on all three legal pages) | **Pending (owner)**. Set in Admin → Profile. |
| Privacy contact (uses the public contact email) | **Pending (owner)** |
| Legal review of the Privacy, Terms and Disclaimer templates | **Pending**. These are templates, not legally reviewed documents. Strongly recommended because the site discusses sport near gambling topics. |

## Known limitations (accepted for launch)

- An unknown episode URL shows a 404 page with `noindex`, but HTTP status 200, because of streaming rendering.
- Changes made directly in the Supabase dashboard (not through the admin) appear on public pages within about a minute.
- No email notification for contact messages; check Admin → Messages.
- Online payments are not built. Premium is handled by contacting the astrologer.
