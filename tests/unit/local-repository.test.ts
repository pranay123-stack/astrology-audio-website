import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalRepository } from "@/lib/data/local";
import { RepositoryError, type EpisodeWrite } from "@/lib/data/repository";

const day = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();

function fixture() {
  const cat = (id: string, slug: string, section: "cricket" | "general", i: number) => ({
    id, slug, name: slug, section, description: "", sort_order: i,
  });
  const ep = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    title: `Episode ${id}`,
    slug: `episode-${id}`,
    excerpt: "An excerpt long enough",
    description: "",
    category_id: "c-gen",
    audio_storage_path: "audio/00000000-0000-4000-a000-000000000001.mp3",
    audio_mime_type: "audio/mpeg",
    cover_image_path: null,
    duration_seconds: 60,
    is_published: true,
    is_premium: false,
    is_demo: false,
    play_count: 0,
    published_at: iso(-1),
    created_at: iso(-1),
    updated_at: iso(-1),
    ...over,
  });
  return {
    version: 1,
    profile: {
      id: "p", display_name: "Astro", tagline: "", biography: "", experience: "", specializations: [], profile_image_path: null,
      contact_email: "", contact_phone: "", location: "", consultation_info: "", social_links: {}, legal_business_name: "",
      legal_jurisdiction: "", updated_at: iso(0),
    },
    categories: [cat("c-cric", "cricket-astrology", "cricket", 0), cat("c-gen", "daily-astrology", "general", 1), cat("c-ved", "vedic-astrology", "general", 2)],
    competitions: [
      { id: "bbl", name: "Big Bash League", short_name: "BBL", slug: "bbl", description: "", is_active: true },
      { id: "ipl", name: "Indian Premier League", short_name: "IPL", slug: "ipl", description: "", is_active: true },
    ],
    teams: [
      { id: "t1", competition_id: "bbl", name: "Sydney Sixers", short_name: "SIX", logo_path: null, primary_color: "#e6007e" },
      { id: "t2", competition_id: "bbl", name: "Brisbane Heat", short_name: "HEA", logo_path: null, primary_color: "#00a3ad" },
      { id: "t3", competition_id: "ipl", name: "IPL Team", short_name: "IPT", logo_path: null, primary_color: "#000000" },
      { id: "d1", competition_id: "bbl", name: "Demo Team A", short_name: "DTA", logo_path: null, primary_color: "#7c3aed" },
    ],
    episodes: [
      ep("e1", { title: "Daily reading", play_count: 5, published_at: iso(-3) }),
      ep("e2", { title: "Vedic lesson", category_id: "c-ved", is_premium: true, play_count: 50, published_at: iso(-2) }),
      ep("e3", { title: "Draft", is_published: false, published_at: null }),
      ep("e4", { title: "Scheduled", published_at: iso(+2) }),
      ep("m1", { title: "Sixers v Heat", category_id: "c-cric", published_at: iso(-1) }),
      ep("m2", { title: "Old match", category_id: "c-cric", published_at: iso(-5), is_demo: true }),
    ],
    cricket_matches: [
      { id: "x1", episode_id: "m1", competition_id: "bbl", team_a_id: "t1", team_b_id: "t2", match_date: iso(+1), venue: "SCG", match_status: "scheduled" },
      { id: "x2", episode_id: "m2", competition_id: "bbl", team_a_id: "d1", team_b_id: "t2", match_date: iso(-4), venue: "", match_status: "completed" },
    ],
    contact_messages: [],
  };
}

let dir: string;
let repo: LocalRepository;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "astro-repo-"));
  await writeFile(path.join(dir, "db.json"), JSON.stringify(fixture()));
  repo = new LocalRepository(dir);
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const write = (over: Partial<EpisodeWrite> = {}): EpisodeWrite => ({
  title: "New episode",
  slug: "new-episode",
  excerpt: "A new excerpt",
  description: "",
  category_id: "c-gen",
  audio_storage_path: "audio/00000000-0000-4000-a000-000000000002.mp3",
  audio_mime_type: "audio/mpeg",
  cover_image_path: null,
  duration_seconds: 120,
  is_published: true,
  is_premium: false,
  published_at: iso(-0.01),
  match: null,
  ...over,
});

describe("public visibility", () => {
  it("lists only live episodes to visitors", async () => {
    const { items, total } = await repo.queryEpisodes({});
    expect(items.map((e) => e.id).sort()).toEqual(["e1", "e2", "m1", "m2"]);
    expect(total).toBe(4);
  });
  it("includes drafts and scheduled episodes for admins", async () => {
    expect((await repo.queryEpisodes({ includeUnpublished: true })).total).toBe(6);
  });
  it("hides drafts and scheduled episodes from slug and id lookups", async () => {
    expect(await repo.getEpisodeBySlug("episode-e3")).toBeNull();
    expect(await repo.getEpisodeById("e4")).toBeNull();
    expect(await repo.getEpisodeById("e4", { includeUnpublished: true })).not.toBeNull();
  });
});

describe("filters", () => {
  it("filters by section, category and access", async () => {
    expect((await repo.queryEpisodes({ section: "cricket" })).items.map((e) => e.id).sort()).toEqual(["m1", "m2"]);
    expect((await repo.queryEpisodes({ categorySlug: "vedic-astrology" })).items.map((e) => e.id)).toEqual(["e2"]);
    expect((await repo.queryEpisodes({ access: "premium" })).items.map((e) => e.id)).toEqual(["e2"]);
    expect((await repo.queryEpisodes({ access: "free", section: "general" })).items.map((e) => e.id)).toEqual(["e1"]);
  });
  it("splits upcoming and past matches by start time", async () => {
    expect((await repo.queryEpisodes({ timing: "upcoming" })).items.map((e) => e.id)).toEqual(["m1"]);
    expect((await repo.queryEpisodes({ timing: "past" })).items.map((e) => e.id)).toEqual(["m2"]);
  });
  it("searches team names, short codes and venues case-insensitively", async () => {
    expect((await repo.queryEpisodes({ search: "sixers" })).items.map((e) => e.id)).toEqual(["m1"]);
    expect((await repo.queryEpisodes({ search: "HEA" })).items.map((e) => e.id).sort()).toEqual(["m1", "m2"]);
    expect((await repo.queryEpisodes({ search: "scg" })).items.map((e) => e.id)).toEqual(["m1"]);
  });
  it("filters by competition", async () => {
    expect((await repo.queryEpisodes({ competitionSlug: "ipl" })).total).toBe(0);
    expect((await repo.queryEpisodes({ competitionSlug: "bbl" })).total).toBe(2);
  });
  it("sorts by popularity and paginates", async () => {
    const popular = await repo.queryEpisodes({ sort: "popular" });
    expect(popular.items[0].id).toBe("e2");
    const page = await repo.queryEpisodes({ sort: "latest", limit: 2, offset: 1 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(4);
  });
});

describe("writes", () => {
  it("creates, updates and deletes an episode with its match", async () => {
    const created = await repo.createEpisode(
      write({
        category_id: "c-cric",
        slug: "new-match",
        match: { competition_id: "bbl", team_a_id: "t1", team_b_id: "t2", match_date: iso(3), venue: "", match_status: "scheduled" },
      }),
    );
    let row = await repo.getEpisodeById(created.id);
    expect(row?.match?.team_a.name).toBe("Sydney Sixers");

    await repo.updateEpisode(created.id, write({ slug: "new-match", category_id: "c-gen", match: null }));
    row = await repo.getEpisodeById(created.id);
    expect(row?.category.section).toBe("general");
    expect(row?.match).toBeNull();

    const deleted = await repo.deleteEpisode(created.id);
    expect(deleted?.audio_storage_path).toBe("audio/00000000-0000-4000-a000-000000000002.mp3");
    expect(await repo.getEpisodeById(created.id, { includeUnpublished: true })).toBeNull();
  });

  it("rejects duplicate slugs", async () => {
    await expect(repo.createEpisode(write({ slug: "episode-e1" }))).rejects.toThrow(RepositoryError);
  });

  it("requires match details for cricket and same-competition teams", async () => {
    await expect(repo.createEpisode(write({ category_id: "c-cric" }))).rejects.toThrow(/match details/);
    await expect(
      repo.createEpisode(
        write({ category_id: "c-cric", match: { competition_id: "bbl", team_a_id: "t1", team_b_id: "t3", match_date: iso(1), venue: "", match_status: "scheduled" } }),
      ),
    ).rejects.toThrow(/same|competition/);
  });

  it("refuses to publish without audio", async () => {
    const draft = await repo.createEpisode(write({ is_published: false, published_at: null, audio_storage_path: null, slug: "no-audio" }));
    await expect(repo.setEpisodePublished(draft.id, true)).rejects.toThrow(/audio/);
  });

  it("stamps a publication date when publishing a draft", async () => {
    const e = await repo.setEpisodePublished("e3", true);
    expect(e.published_at).not.toBeNull();
    expect(await repo.getEpisodeById("e3")).not.toBeNull();
  });

  it("serialises concurrent writes without losing updates", async () => {
    await Promise.all(Array.from({ length: 20 }, () => repo.incrementPlayCount("e1")));
    expect((await repo.getEpisodeById("e1"))?.play_count).toBe(25);
  });

  it("does not count plays for drafts", async () => {
    await repo.incrementPlayCount("e3");
    expect((await repo.getEpisodeById("e3", { includeUnpublished: true }))?.play_count).toBe(0);
  });

  it("removes demo episodes and unused demo teams only", async () => {
    const removed = await repo.deleteDemoEpisodes();
    expect(removed.map((e) => e.id)).toEqual(["m2"]);
    const teams = await repo.listTeams();
    expect(teams.some((t) => t.name === "Demo Team A")).toBe(false);
    expect(teams).toHaveLength(3);
  });

  it("protects teams and competitions that are in use", async () => {
    await expect(repo.deleteTeam("t1")).rejects.toThrow(/used/);
    await expect(repo.deleteCompetition("bbl")).rejects.toThrow();
    expect(await repo.deleteTeam("t3")).toMatchObject({ id: "t3" });
    await expect(repo.deleteCompetition("ipl")).resolves.toBeUndefined();
  });

  it("tracks storage references", async () => {
    expect(await repo.isStoragePathReferenced("audio/00000000-0000-4000-a000-000000000001.mp3")).toBe(true);
    expect(await repo.isStoragePathReferenced("audio/ffffffff-0000-4000-a000-000000000001.mp3")).toBe(false);
  });

  it("stores contact messages and reports stats", async () => {
    await repo.createContactMessage({ name: "Ann", email: "a@b.co", subject: "", message: "Hello there, a question" });
    const stats = await repo.stats();
    expect(stats).toMatchObject({ total: 6, published: 4, drafts: 1, scheduled: 1, premium: 1, demo: 1, unreadMessages: 1 });
    const [msg] = await repo.listContactMessages();
    await repo.setContactMessageRead(msg.id, true);
    expect((await repo.stats()).unreadMessages).toBe(0);
  });
});
