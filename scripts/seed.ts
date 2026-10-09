/**
 * Seeds reference data (categories, the BBL competition and clubs, a placeholder
 * profile) and, optionally, clearly labelled demonstration episodes.
 *
 * Local mode includes the demo episodes by default; Supabase mode (production)
 * never adds them unless --demo is passed explicitly.
 *
 *   npm run seed                 # local: first-time setup (refuses to overwrite local data)
 *   npm run seed -- --reset      # local: wipe .data and start again
 *   npm run seed -- --no-demo    # reference data only
 *   npm run seed -- --demo       # Supabase: also add the sample episodes (staging/testing only)
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv, stableUuid } from "./lib/env";
import { renderCover, renderProfilePlaceholder } from "./lib/covers";

loadEnv();

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");

async function main() {
  const { getDataBackend, localPaths, siteConfig } = await import("../src/lib/config");
  const { zonedTimeToUtc } = await import("../src/lib/dates");
  const content = await import("../seed/content");
  const backend = getDataBackend();
  const WITH_DEMO = backend === "local" ? !args.has("--no-demo") : args.has("--demo");
  console.log(`Seeding (${backend} mode)${WITH_DEMO ? " with demo content" : ""}...`);

  // ---- media --------------------------------------------------------------
  const media: { path: string; contentType: string; data: Buffer }[] = [];
  const audioPath: Record<string, string> = {};
  for (const file of Object.keys(content.demoAudioDurations)) {
    const p = `audio/${stableUuid(`demo-audio:${file}`)}.mp3`;
    audioPath[file] = p;
    if (WITH_DEMO) media.push({ path: p, contentType: "audio/mpeg", data: await readFile(path.join("seed/media", file)) });
  }
  const coverPath: Record<string, string> = {};
  if (WITH_DEMO) {
    for (const [i, ep] of content.demoEpisodes.entries()) {
      const p = `covers/${stableUuid(`demo-cover:${ep.slug}`)}.webp`;
      coverPath[ep.slug] = p;
      media.push({ path: p, contentType: "image/webp", data: await renderCover({ ...ep.cover, label: "SAMPLE", seed: i + 7 }) });
    }
  }
  const profileImagePath = `profile/${stableUuid("placeholder-profile")}.webp`;
  media.push({ path: profileImagePath, contentType: "image/webp", data: await renderProfilePlaceholder() });

  // ---- dates --------------------------------------------------------------
  const now = Date.now();
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: siteConfig.timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(now))
    .split("-")
    .map(Number);
  const matchDate = (inDays: number, hour: number) => {
    const d = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2] + inDays));
    return new Date(zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour, 0, siteConfig.timeZone)).toISOString();
  };
  const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

  if (backend === "local") {
    const dir = path.resolve(localPaths.dataDir);
    const dbFile = path.join(dir, "db.json");
    if (existsSync(dbFile) && !RESET) {
      console.error(`${dbFile} already exists. Use \`npm run seed -- --reset\` to wipe it and start again.`);
      process.exit(1);
    }
    await rm(dir, { recursive: true, force: true });
    for (const m of media) {
      const target = path.join(dir, "storage", m.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, m.data);
    }

    const categories = content.categories.map((c, i) => ({ id: randomUUID(), ...c, sort_order: i }));
    const competitions = content.competitions.map((c) => ({ id: randomUUID(), ...c, is_active: true }));
    const bbl = competitions[0];
    const teams = [...content.bblTeams, ...(WITH_DEMO ? content.demoTeams : [])].map((t) => ({
      id: randomUUID(),
      competition_id: bbl.id,
      logo_path: null,
      ...t,
    }));
    const episodes = [];
    const matches = [];
    if (WITH_DEMO) {
      for (const ep of content.demoEpisodes) {
        const id = randomUUID();
        const published = daysAgo(ep.publishedDaysAgo);
        episodes.push({
          id,
          title: ep.title,
          slug: ep.slug,
          excerpt: ep.excerpt,
          description: ep.description,
          category_id: categories.find((c) => c.slug === ep.category)!.id,
          audio_storage_path: audioPath[ep.audio],
          audio_mime_type: "audio/mpeg",
          cover_image_path: coverPath[ep.slug],
          duration_seconds: content.demoAudioDurations[ep.audio],
          is_published: true,
          is_premium: !!ep.premium,
          is_demo: true,
          play_count: ep.playCount,
          published_at: published,
          created_at: published,
          updated_at: published,
        });
        if (ep.match) {
          matches.push({
            id: randomUUID(),
            episode_id: id,
            competition_id: bbl.id,
            team_a_id: teams.find((t) => t.name === ep.match!.teamA)!.id,
            team_b_id: teams.find((t) => t.name === ep.match!.teamB)!.id,
            match_date: matchDate(ep.match.inDays, ep.match.hourLocal),
            venue: ep.match.venue,
            match_status: ep.match.status,
          });
        }
      }
    }
    const db = {
      version: 1,
      profile: { id: randomUUID(), ...content.profile, profile_image_path: profileImagePath, updated_at: new Date(now).toISOString() },
      categories,
      competitions,
      teams,
      episodes,
      cricket_matches: matches,
      contact_messages: [],
    };
    await writeFile(dbFile, JSON.stringify(db, null, 2));
    console.log(`Wrote ${dbFile}: ${episodes.length} episodes, ${teams.length} teams, ${media.length} media files.`);
    return;
  }

  // ---- Supabase -----------------------------------------------------------
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const must = <T>(res: { data: T; error: { message: string } | null }, what: string): T => {
    if (res.error) throw new Error(`${what}: ${res.error.message}`);
    return res.data;
  };

  for (const m of media) {
    const bucket = m.path.startsWith("audio/") ? "audio" : "images";
    must(await sb.storage.from(bucket).upload(m.path, m.data, { contentType: m.contentType, upsert: true }), `upload ${m.path}`);
  }

  const cats = must(
    await sb
      .from("categories")
      .upsert(content.categories.map((c, i) => ({ ...c, sort_order: i })), { onConflict: "slug" })
      .select("id,slug"),
    "categories",
  ) as { id: string; slug: string }[];
  const comps = must(await sb.from("competitions").upsert([...content.competitions], { onConflict: "slug" }).select("id,slug"), "competitions") as {
    id: string;
    slug: string;
  }[];
  const bblId = comps.find((c) => c.slug === "bbl")!.id;
  const teams = must(
    await sb
      .from("teams")
      .upsert([...content.bblTeams, ...(WITH_DEMO ? content.demoTeams : [])].map((t) => ({ ...t, competition_id: bblId })), {
        onConflict: "competition_id,name",
      })
      .select("id,name"),
    "teams",
  ) as { id: string; name: string }[];

  const existingProfile = must(await sb.from("profiles").select("id").limit(1), "profiles") as { id: string }[];
  if (existingProfile.length === 0) {
    must(await sb.from("profiles").insert({ ...content.profile, profile_image_path: profileImagePath }), "profile");
  }

  if (WITH_DEMO) {
    for (const ep of content.demoEpisodes) {
      const published = daysAgo(ep.publishedDaysAgo);
      const row = must(
        await sb
          .from("episodes")
          .upsert(
            {
              title: ep.title,
              slug: ep.slug,
              excerpt: ep.excerpt,
              description: ep.description,
              category_id: cats.find((c) => c.slug === ep.category)!.id,
              audio_storage_path: audioPath[ep.audio],
              audio_mime_type: "audio/mpeg",
              cover_image_path: coverPath[ep.slug],
              duration_seconds: content.demoAudioDurations[ep.audio],
              is_published: true,
              is_premium: !!ep.premium,
              is_demo: true,
              play_count: ep.playCount,
              published_at: published,
            },
            { onConflict: "slug" },
          )
          .select("id")
          .single(),
        `episode ${ep.slug}`,
      ) as { id: string };
      if (ep.match) {
        must(
          await sb.from("cricket_matches").upsert(
            {
              episode_id: row.id,
              competition_id: bblId,
              team_a_id: teams.find((t) => t.name === ep.match!.teamA)!.id,
              team_b_id: teams.find((t) => t.name === ep.match!.teamB)!.id,
              match_date: matchDate(ep.match.inDays, ep.match.hourLocal),
              venue: ep.match.venue,
              match_status: ep.match.status,
            },
            { onConflict: "episode_id" },
          ),
          `match ${ep.slug}`,
        );
      }
    }
  }
  console.log(`Seeded Supabase: ${cats.length} categories, ${teams.length} teams${WITH_DEMO ? `, ${content.demoEpisodes.length} demo episodes` : ""}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
