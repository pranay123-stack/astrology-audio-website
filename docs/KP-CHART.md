# KP birth chart

## What it calculates

| Setting | Value |
|---|---|
| Ayanamsa | **KP New**: mean value 23°46'00" at J2000 + 50.2842"/year, applied with nutation (as the astrologer's KP software, app.kpastro.ai) |
| Houses | Placidus |
| Rahu / Ketu | Mean node; Ketu = Rahu + 180° |
| Fortuna | Ascendant + Moon − Sun |
| Ephemeris | Swiss Ephemeris, built-in Moshier mode (no data files needed) |
| Dasha | Vimshottari, 1 year = 365.2422 days |

Code: `src/lib/kp/` (`engine.ts` positions, `lords.ts` lords and dasha, `significators.ts` occupancy, ownership, ABCD, U badge, `time.ts` birth time → UTC with historic offsets).

## Accuracy check

`scripts/kp-verify.ts` compares the engine with 7 charts made in the astrologer's KP software (1959–2026). Latest result:

- planet and cusp degrees: 127/127 within 0.6"
- star and sub lords: 127/127 identical
- maha dasha start and end dates: 14/14
- displayed ayanamsa, ABCD tables, sub-lord houses, U and R badges, padas: 51/51

The reference charts are real people's birth details, so they are **not in this repository**. Keep them private and run:

```bash
KP_REFERENCE_FILE=../kp-reference-private/kp-reference-charts.json \
  NODE_OPTIONS=--conditions=react-server npx tsx scripts/kp-verify.ts
```

Not built yet, because the rules could not be confirmed from the reference screens: the planetary **aspects** table (orbs differ by planet in the reference), the benefic/malefic **Nature** column, and **conjunction / opposition lords** in the strength table. The astrologer needs to confirm the rules his software uses.

## Saved charts (Google sign-in)

Visitors sign in with Google and save charts with notes. Only the birth details are stored (`kp_charts` table); each user can read and change only their own rows (RLS, tested in `tests/supabase/rls.test.ts`). The feature is hidden until `NEXT_PUBLIC_KP_ACCOUNTS=true`.

### One-time setup

1. **Google Cloud** (console.cloud.google.com) → create a project → *APIs & Services* → *OAuth consent screen*: External, app name "Astro Cricket", support email, publish the app.
2. *Credentials* → *Create credentials* → *OAuth client ID* → Web application.
   - Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.
3. **Supabase** → *Authentication* → *Sign In / Providers* → **Google**: enable, paste the Client ID and secret, save.
4. Supabase → *Authentication* → *Sign In / Providers*: turn **Allow new users to sign up** on (Google visitors are new users). Keep **Confirm email** on.
5. Supabase → *Authentication* → *URL Configuration*: Site URL = the live site; add redirect URLs `https://<site>/kp-chart` and `https://<site>/hi/kp-chart`.
6. Hosting → environment variable `NEXT_PUBLIC_KP_ACCOUNTS=true` → redeploy.

Admin access is unaffected: the admin panel requires a row in `admins`, so a Google user is never an admin.

## Licence

The Swiss Ephemeris is AGPL-3.0 (or a paid Astrodienst licence). This project uses the AGPL route: the code is public at the URL in `NEXT_PUBLIC_SOURCE_URL`, linked from every page, and licensed AGPL-3.0 (`LICENSE`).
