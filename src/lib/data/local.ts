import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Category, Competition, Episode, EpisodeListing, EpisodeQuery, Profile, Team } from "../types";
import type { CompetitionData, ProfileData, TeamData } from "../validation";
import { slugify, uniqueSlug } from "../slug";
import { LocalDb, type LocalDatabase } from "./local-db";
import {
  filterAndSort,
  isLive,
  RepositoryError,
  type DashboardStats,
  type EpisodeWrite,
  type Repository,
} from "./repository";

function teamSummary(t: Team) {
  return { id: t.id, name: t.name, short_name: t.short_name, logo_path: t.logo_path, primary_color: t.primary_color };
}

export function buildListings(db: LocalDatabase): EpisodeListing[] {
  const cats = new Map(db.categories.map((c) => [c.id, c]));
  const comps = new Map(db.competitions.map((c) => [c.id, c]));
  const teams = new Map(db.teams.map((t) => [t.id, t]));
  const matches = new Map(db.cricket_matches.map((m) => [m.episode_id, m]));

  return db.episodes.flatMap((e) => {
    const cat = cats.get(e.category_id);
    if (!cat) return [];
    const m = matches.get(e.id);
    let match: EpisodeListing["match"] = null;
    if (m) {
      const comp = comps.get(m.competition_id);
      const a = teams.get(m.team_a_id);
      const b = teams.get(m.team_b_id);
      if (comp && a && b) {
        match = {
          ...m,
          competition: { id: comp.id, name: comp.name, short_name: comp.short_name, slug: comp.slug },
          team_a: teamSummary(a),
          team_b: teamSummary(b),
        };
      }
    }
    return [{ ...e, category: { id: cat.id, name: cat.name, slug: cat.slug, section: cat.section }, match }];
  });
}

export class LocalRepository implements Repository {
  readonly db: LocalDb;

  constructor(dataDir: string) {
    this.db = new LocalDb(path.resolve(dataDir));
  }

  async listCategories(): Promise<Category[]> {
    const db = await this.db.read();
    return [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  async listCompetitions(): Promise<Competition[]> {
    const db = await this.db.read();
    return [...db.competitions].sort((a, b) => a.name.localeCompare(b.name));
  }

  async listTeams(): Promise<Team[]> {
    const db = await this.db.read();
    return [...db.teams].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProfile(): Promise<Profile> {
    return (await this.db.read()).profile;
  }

  async queryEpisodes(query: EpisodeQuery) {
    return filterAndSort(buildListings(await this.db.read()), query);
  }

  async getEpisodeBySlug(slug: string, opts?: { includeUnpublished?: boolean }) {
    const row = buildListings(await this.db.read()).find((r) => r.slug === slug);
    if (!row || (!opts?.includeUnpublished && !isLive(row))) return null;
    return row;
  }

  async getEpisodeById(id: string, opts?: { includeUnpublished?: boolean }) {
    const row = buildListings(await this.db.read()).find((r) => r.id === id);
    if (!row || (!opts?.includeUnpublished && !isLive(row))) return null;
    return row;
  }

  async listEpisodeSlugs() {
    return (await this.db.read()).episodes.map((e) => ({ id: e.id, slug: e.slug }));
  }

  async incrementPlayCount(id: string) {
    await this.db.mutate((db) => {
      const e = db.episodes.find((x) => x.id === id);
      if (e && isLive(e)) e.play_count += 1;
    });
  }

  private assertReferences(db: LocalDatabase, data: EpisodeWrite) {
    const cat = db.categories.find((c) => c.id === data.category_id);
    if (!cat) throw new RepositoryError("Category not found", "invalid");
    if (cat.section === "cricket" && !data.match) {
      throw new RepositoryError("Cricket episodes need match details", "invalid");
    }
    if (data.match) {
      const { competition_id, team_a_id, team_b_id } = data.match;
      if (!db.competitions.some((c) => c.id === competition_id)) throw new RepositoryError("Competition not found", "invalid");
      for (const tid of [team_a_id, team_b_id]) {
        const t = db.teams.find((x) => x.id === tid);
        if (!t || t.competition_id !== competition_id) {
          throw new RepositoryError("Both teams must belong to the selected competition", "invalid");
        }
      }
    }
    if (db.episodes.some((e) => e.slug === data.slug && e.id !== (data as { id?: string }).id)) {
      throw new RepositoryError("Another episode already uses this URL slug", "conflict");
    }
    return cat;
  }

  private writeMatch(db: LocalDatabase, episodeId: string, data: EpisodeWrite, isCricket: boolean) {
    const existing = db.cricket_matches.find((m) => m.episode_id === episodeId);
    if (!isCricket || !data.match) {
      db.cricket_matches = db.cricket_matches.filter((m) => m.episode_id !== episodeId);
      return;
    }
    if (existing) Object.assign(existing, data.match);
    else db.cricket_matches.push({ id: randomUUID(), episode_id: episodeId, ...data.match });
  }

  async createEpisode(data: EpisodeWrite): Promise<Episode> {
    return this.db.mutate((db) => {
      const cat = this.assertReferences(db, data);
      const now = new Date().toISOString();
      const { match: _match, ...fields } = data;
      void _match;
      const episode: Episode = {
        ...fields,
        id: randomUUID(),
        is_demo: false,
        play_count: 0,
        created_at: now,
        updated_at: now,
      };
      db.episodes.push(episode);
      this.writeMatch(db, episode.id, data, cat.section === "cricket");
      return episode;
    });
  }

  async updateEpisode(id: string, data: EpisodeWrite): Promise<Episode> {
    return this.db.mutate((db) => {
      const episode = db.episodes.find((e) => e.id === id);
      if (!episode) throw new RepositoryError("Episode not found", "not_found");
      const cat = this.assertReferences(db, { ...data, id } as EpisodeWrite);
      const { match: _match, ...fields } = data;
      void _match;
      Object.assign(episode, fields, { updated_at: new Date().toISOString() });
      this.writeMatch(db, id, data, cat.section === "cricket");
      return episode;
    });
  }

  async setEpisodePublished(id: string, published: boolean): Promise<Episode> {
    return this.db.mutate((db) => {
      const episode = db.episodes.find((e) => e.id === id);
      if (!episode) throw new RepositoryError("Episode not found", "not_found");
      if (published && !episode.audio_storage_path) {
        throw new RepositoryError("Upload an audio file before publishing", "invalid");
      }
      episode.is_published = published;
      if (published && !episode.published_at) episode.published_at = new Date().toISOString();
      episode.updated_at = new Date().toISOString();
      return episode;
    });
  }

  async deleteEpisode(id: string): Promise<Episode | null> {
    return this.db.mutate((db) => {
      const episode = db.episodes.find((e) => e.id === id) ?? null;
      db.episodes = db.episodes.filter((e) => e.id !== id);
      db.cricket_matches = db.cricket_matches.filter((m) => m.episode_id !== id);
      return episode;
    });
  }

  async deleteDemoEpisodes(): Promise<Episode[]> {
    return this.db.mutate((db) => {
      const demo = db.episodes.filter((e) => e.is_demo);
      const ids = new Set(demo.map((e) => e.id));
      db.episodes = db.episodes.filter((e) => !ids.has(e.id));
      db.cricket_matches = db.cricket_matches.filter((m) => !ids.has(m.episode_id));
      // Demo teams exist only to illustrate the layout; remove them once unused.
      const used = new Set(db.cricket_matches.flatMap((m) => [m.team_a_id, m.team_b_id]));
      db.teams = db.teams.filter((t) => !t.name.startsWith("Demo Team") || used.has(t.id));
      return demo;
    });
  }

  async isStoragePathReferenced(p: string): Promise<boolean> {
    const db = await this.db.read();
    return (
      db.episodes.some((e) => e.audio_storage_path === p || e.cover_image_path === p) ||
      db.teams.some((t) => t.logo_path === p) ||
      db.profile.profile_image_path === p
    );
  }

  async updateProfile(data: ProfileData): Promise<Profile> {
    return this.db.mutate((db) => {
      db.profile = { ...db.profile, ...data, updated_at: new Date().toISOString() };
      return db.profile;
    });
  }

  async saveCompetition(data: CompetitionData): Promise<Competition> {
    return this.db.mutate((db) => {
      if (data.id) {
        const c = db.competitions.find((x) => x.id === data.id);
        if (!c) throw new RepositoryError("Competition not found", "not_found");
        Object.assign(c, { name: data.name, short_name: data.short_name, description: data.description, is_active: data.is_active });
        return c;
      }
      const slug = uniqueSlug(slugify(data.short_name), new Set(db.competitions.map((c) => c.slug)));
      const c: Competition = {
        id: randomUUID(),
        name: data.name,
        short_name: data.short_name,
        slug,
        description: data.description,
        is_active: data.is_active,
      };
      db.competitions.push(c);
      return c;
    });
  }

  async deleteCompetition(id: string): Promise<void> {
    await this.db.mutate((db) => {
      if (db.cricket_matches.some((m) => m.competition_id === id) || db.teams.some((t) => t.competition_id === id)) {
        throw new RepositoryError("Remove this competition's teams and episodes first", "conflict");
      }
      db.competitions = db.competitions.filter((c) => c.id !== id);
    });
  }

  async saveTeam(data: TeamData): Promise<Team> {
    return this.db.mutate((db) => {
      if (!db.competitions.some((c) => c.id === data.competition_id)) {
        throw new RepositoryError("Competition not found", "invalid");
      }
      const clash = db.teams.find(
        (t) => t.competition_id === data.competition_id && t.name.toLowerCase() === data.name.toLowerCase() && t.id !== data.id,
      );
      if (clash) throw new RepositoryError("A team with this name already exists in the competition", "conflict");
      if (data.id) {
        const t = db.teams.find((x) => x.id === data.id);
        if (!t) throw new RepositoryError("Team not found", "not_found");
        if (t.competition_id !== data.competition_id && db.cricket_matches.some((m) => m.team_a_id === t.id || m.team_b_id === t.id)) {
          throw new RepositoryError("This team is used by episodes, so its competition cannot change", "conflict");
        }
        Object.assign(t, { ...data, id: t.id });
        return t;
      }
      const t: Team = { ...data, id: randomUUID() };
      db.teams.push(t);
      return t;
    });
  }

  async deleteTeam(id: string): Promise<Team | null> {
    return this.db.mutate((db) => {
      if (db.cricket_matches.some((m) => m.team_a_id === id || m.team_b_id === id)) {
        throw new RepositoryError("This team is used by one or more episodes", "conflict");
      }
      const team = db.teams.find((t) => t.id === id) ?? null;
      db.teams = db.teams.filter((t) => t.id !== id);
      return team;
    });
  }

  async createContactMessage(msg: { name: string; email: string; subject: string; message: string }) {
    await this.db.mutate((db) => {
      db.contact_messages.push({ ...msg, id: randomUUID(), is_read: false, created_at: new Date().toISOString() });
    });
  }

  async listContactMessages() {
    const db = await this.db.read();
    return [...db.contact_messages].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }

  async setContactMessageRead(id: string, isRead: boolean) {
    await this.db.mutate((db) => {
      const m = db.contact_messages.find((x) => x.id === id);
      if (m) m.is_read = isRead;
    });
  }

  async deleteContactMessage(id: string) {
    await this.db.mutate((db) => {
      db.contact_messages = db.contact_messages.filter((m) => m.id !== id);
    });
  }

  async stats(): Promise<DashboardStats> {
    const db = await this.db.read();
    const now = Date.now();
    const categories = [...db.categories].sort((a, b) => a.sort_order - b.sort_order);
    return {
      total: db.episodes.length,
      published: db.episodes.filter((e) => isLive(e, now)).length,
      drafts: db.episodes.filter((e) => !e.is_published).length,
      scheduled: db.episodes.filter((e) => e.is_published && !isLive(e, now)).length,
      premium: db.episodes.filter((e) => e.is_premium).length,
      demo: db.episodes.filter((e) => e.is_demo).length,
      unreadMessages: db.contact_messages.filter((m) => !m.is_read).length,
      byCategory: categories.map((category) => ({
        category,
        count: db.episodes.filter((e) => e.category_id === category.id).length,
      })),
    };
  }
}
