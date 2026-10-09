import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Competition,
  ContactMessage,
  Episode,
  EpisodeListing,
  EpisodePage,
  EpisodeQuery,
  MatchStatus,
  Profile,
  Section,
  Team,
} from "../types";
import type { CompetitionData, ProfileData, TeamData } from "../validation";
import { dayBounds } from "../dates";
import { slugify, uniqueSlug } from "../slug";
import { RepositoryError, type DashboardStats, type EpisodeWrite, type Repository } from "./repository";

const EPISODE_COLUMNS =
  "id,title,slug,excerpt,description,category_id,audio_storage_path,audio_mime_type,cover_image_path,duration_seconds,is_published,is_premium,is_demo,play_count,published_at,created_at,updated_at";

type ListingRow = Episode & {
  category_name: string;
  category_slug: string;
  category_section: Section;
  match_id: string | null;
  match_competition_id: string | null;
  match_team_a_id: string | null;
  match_team_b_id: string | null;
  match_date: string | null;
  match_venue: string | null;
  match_status: MatchStatus | null;
  competition_name: string | null;
  competition_short_name: string | null;
  competition_slug: string | null;
  team_a_name: string | null;
  team_a_short_name: string | null;
  team_a_logo_path: string | null;
  team_a_color: string | null;
  team_b_name: string | null;
  team_b_short_name: string | null;
  team_b_logo_path: string | null;
  team_b_color: string | null;
};

function toListing(r: ListingRow): EpisodeListing {
  const episode: Episode = {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    description: r.description,
    category_id: r.category_id,
    audio_storage_path: r.audio_storage_path,
    audio_mime_type: r.audio_mime_type,
    cover_image_path: r.cover_image_path,
    duration_seconds: r.duration_seconds,
    is_published: r.is_published,
    is_premium: r.is_premium,
    is_demo: r.is_demo,
    play_count: r.play_count,
    published_at: r.published_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
  const match: EpisodeListing["match"] =
    r.match_id && r.match_competition_id && r.match_team_a_id && r.match_team_b_id && r.match_date
      ? {
          id: r.match_id,
          episode_id: r.id,
          competition_id: r.match_competition_id,
          team_a_id: r.match_team_a_id,
          team_b_id: r.match_team_b_id,
          match_date: r.match_date,
          venue: r.match_venue ?? "",
          match_status: r.match_status ?? "scheduled",
          competition: {
            id: r.match_competition_id,
            name: r.competition_name ?? "",
            short_name: r.competition_short_name ?? "",
            slug: r.competition_slug ?? "",
          },
          team_a: {
            id: r.match_team_a_id,
            name: r.team_a_name ?? "",
            short_name: r.team_a_short_name ?? "",
            logo_path: r.team_a_logo_path,
            primary_color: r.team_a_color ?? "#4c1d95",
          },
          team_b: {
            id: r.match_team_b_id,
            name: r.team_b_name ?? "",
            short_name: r.team_b_short_name ?? "",
            logo_path: r.team_b_logo_path,
            primary_color: r.team_b_color ?? "#4c1d95",
          },
        }
      : null;
  return {
    ...episode,
    category: { id: r.category_id, name: r.category_name, slug: r.category_slug, section: r.category_section },
    match,
  };
}

function fail(error: PostgrestError | null, context: string): never {
  const code = error?.code;
  if (code === "23505") throw new RepositoryError("Another record already uses this name or URL slug", "conflict");
  if (code === "23503") throw new RepositoryError("This record is still referenced elsewhere", "conflict");
  if (code === "23514") throw new RepositoryError(error?.message || "Validation failed", "invalid");
  if (code === "P0002") throw new RepositoryError("Not found", "not_found");
  if (code === "42501") throw new RepositoryError("Not authorised", "invalid");
  throw new RepositoryError(`${context}: ${error?.message ?? "unknown database error"}`);
}

/** Escapes LIKE wildcards in user search input. */
function likeEscape(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export class SupabaseRepository implements Repository {
  /**
   * @param db      client used for reads/writes; RLS applies (anon for public pages, session for admin)
   * @param service optional service-role client for operations visitors may not perform directly
   */
  constructor(
    private readonly db: SupabaseClient,
    private readonly service?: SupabaseClient,
  ) {}

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.db.from("categories").select("*").order("sort_order");
    if (error) fail(error, "listCategories");
    return data as Category[];
  }

  async listCompetitions(): Promise<Competition[]> {
    const { data, error } = await this.db.from("competitions").select("*").order("name");
    if (error) fail(error, "listCompetitions");
    return data as Competition[];
  }

  async listTeams(): Promise<Team[]> {
    const { data, error } = await this.db.from("teams").select("*").order("name");
    if (error) fail(error, "listTeams");
    return data as Team[];
  }

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.db.from("profiles").select("*").limit(1).maybeSingle();
    if (error) fail(error, "getProfile");
    if (!data) throw new RepositoryError("Profile row missing. Run `npm run seed`.", "not_found");
    const { singleton: _s, ...profile } = data as Profile & { singleton: boolean };
    void _s;
    return profile;
  }

  async queryEpisodes(q: EpisodeQuery): Promise<EpisodePage> {
    const now = new Date().toISOString();
    let query = this.db.from("episode_listings").select("*", { count: "exact" });
    if (!q.includeUnpublished) query = query.eq("is_published", true).lte("published_at", now);
    if (q.section) query = query.eq("category_section", q.section);
    if (q.categorySlug) query = query.eq("category_slug", q.categorySlug);
    if (q.competitionSlug) query = query.eq("competition_slug", q.competitionSlug);
    if (q.access) query = query.eq("is_premium", q.access === "premium");
    if (q.excludeId) query = query.neq("id", q.excludeId);
    if (q.timing === "upcoming") query = query.gte("match_date", now);
    if (q.timing === "past") query = query.lt("match_date", now);
    const from = q.dateFrom ? dayBounds(q.dateFrom) : null;
    const to = q.dateTo ? dayBounds(q.dateTo) : null;
    if (from || to) {
      const lo = from ? new Date(from.start).toISOString() : null;
      const hi = to ? new Date(to.end).toISOString() : null;
      const range = (col: string) => [lo && `${col}.gte.${lo}`, hi && `${col}.lte.${hi}`].filter(Boolean).join(",");
      query = query.or(`and(match_date.not.is.null,${range("match_date")}),and(match_date.is.null,${range("published_at")})`);
    }
    const search = q.search?.trim().toLowerCase();
    if (search) query = query.ilike("search_text", `%${likeEscape(search)}%`);

    switch (q.sort ?? "latest") {
      case "popular":
        query = query.order("play_count", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false });
        break;
      case "match_date_asc":
        query = query.order("match_date", { ascending: true, nullsFirst: false });
        break;
      case "match_date_desc":
        query = query.order("match_date", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order("published_at", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false });
    }
    const offset = q.offset ?? 0;
    if (q.limit) query = query.range(offset, offset + q.limit - 1);
    else if (offset) query = query.range(offset, offset + 9999);

    const { data, error, count } = await query;
    if (error) fail(error, "queryEpisodes");
    return { items: (data as ListingRow[]).map(toListing), total: count ?? 0 };
  }

  private async getListing(column: "slug" | "id", value: string, includeUnpublished?: boolean) {
    let query = this.db.from("episode_listings").select("*").eq(column, value);
    if (!includeUnpublished) query = query.eq("is_published", true).lte("published_at", new Date().toISOString());
    const { data, error } = await query.maybeSingle();
    if (error) {
      if (error.code === "22P02") return null; // malformed uuid
      fail(error, "getEpisode");
    }
    return data ? toListing(data as ListingRow) : null;
  }

  getEpisodeBySlug(slug: string, opts?: { includeUnpublished?: boolean }) {
    return this.getListing("slug", slug, opts?.includeUnpublished);
  }

  getEpisodeById(id: string, opts?: { includeUnpublished?: boolean }) {
    return this.getListing("id", id, opts?.includeUnpublished);
  }

  async listEpisodeSlugs() {
    const { data, error } = await this.db.from("episodes").select("id,slug");
    if (error) fail(error, "listEpisodeSlugs");
    return data as { id: string; slug: string }[];
  }

  async incrementPlayCount(id: string) {
    const { error } = await this.db.rpc("increment_play_count", { p_episode: id });
    if (error && error.code !== "22P02") fail(error, "incrementPlayCount");
  }

  private async save(id: string | null, data: EpisodeWrite): Promise<Episode> {
    const { match, ...episode } = data;
    const { data: savedId, error } = await this.db.rpc("admin_save_episode", {
      p_id: id,
      p_episode: episode,
      p_match: match,
    });
    if (error) fail(error, "saveEpisode");
    const { data: row, error: readError } = await this.db.from("episodes").select(EPISODE_COLUMNS).eq("id", savedId).single();
    if (readError) fail(readError, "saveEpisode");
    return row as unknown as Episode;
  }

  createEpisode(data: EpisodeWrite) {
    return this.save(null, data);
  }

  updateEpisode(id: string, data: EpisodeWrite) {
    return this.save(id, data);
  }

  async setEpisodePublished(id: string, published: boolean): Promise<Episode> {
    const { data: current, error } = await this.db.from("episodes").select(EPISODE_COLUMNS).eq("id", id).maybeSingle();
    if (error) fail(error, "setEpisodePublished");
    if (!current) throw new RepositoryError("Episode not found", "not_found");
    const ep = current as unknown as Episode;
    if (published && !ep.audio_storage_path) throw new RepositoryError("Upload an audio file before publishing", "invalid");
    const patch: Partial<Episode> = { is_published: published };
    if (published && !ep.published_at) patch.published_at = new Date().toISOString();
    const { data, error: upErr } = await this.db.from("episodes").update(patch).eq("id", id).select(EPISODE_COLUMNS).single();
    if (upErr) fail(upErr, "setEpisodePublished");
    return data as unknown as Episode;
  }

  async deleteEpisode(id: string): Promise<Episode | null> {
    const { data, error } = await this.db.from("episodes").delete().eq("id", id).select(EPISODE_COLUMNS);
    if (error) fail(error, "deleteEpisode");
    return ((data as unknown as Episode[])[0] ?? null);
  }

  async deleteDemoEpisodes(): Promise<Episode[]> {
    const { data, error } = await this.db.from("episodes").delete().eq("is_demo", true).select(EPISODE_COLUMNS);
    if (error) fail(error, "deleteDemoEpisodes");
    const { data: matches } = await this.db.from("cricket_matches").select("team_a_id,team_b_id");
    const used = new Set((matches ?? []).flatMap((m) => [m.team_a_id, m.team_b_id]));
    const { data: demoTeams } = await this.db.from("teams").select("id").like("name", "Demo Team%");
    const unused = (demoTeams ?? []).map((t) => t.id).filter((tid) => !used.has(tid));
    if (unused.length) await this.db.from("teams").delete().in("id", unused);
    return data as unknown as Episode[];
  }

  async isStoragePathReferenced(p: string): Promise<boolean> {
    const checks = await Promise.all([
      this.db.from("episodes").select("id", { count: "exact", head: true }).or(`audio_storage_path.eq."${p}",cover_image_path.eq."${p}"`),
      this.db.from("teams").select("id", { count: "exact", head: true }).eq("logo_path", p),
      this.db.from("profiles").select("id", { count: "exact", head: true }).eq("profile_image_path", p),
    ]);
    for (const c of checks) if (c.error) fail(c.error, "isStoragePathReferenced");
    return checks.some((c) => (c.count ?? 0) > 0);
  }

  async updateProfile(data: ProfileData): Promise<Profile> {
    const current = await this.getProfile();
    const { data: row, error } = await this.db.from("profiles").update(data).eq("id", current.id).select("*").single();
    if (error) fail(error, "updateProfile");
    const { singleton: _s, ...profile } = row as Profile & { singleton: boolean };
    void _s;
    return profile;
  }

  async saveCompetition(data: CompetitionData): Promise<Competition> {
    const fields = { name: data.name, short_name: data.short_name, description: data.description, is_active: data.is_active };
    if (data.id) {
      const { data: row, error } = await this.db.from("competitions").update(fields).eq("id", data.id).select("*").single();
      if (error) fail(error, "saveCompetition");
      return row as Competition;
    }
    const existing = await this.listCompetitions();
    const slug = uniqueSlug(slugify(data.short_name), new Set(existing.map((c) => c.slug)));
    const { data: row, error } = await this.db.from("competitions").insert({ ...fields, slug }).select("*").single();
    if (error) fail(error, "saveCompetition");
    return row as Competition;
  }

  async deleteCompetition(id: string) {
    const { error } = await this.db.from("competitions").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") throw new RepositoryError("Remove this competition's teams and episodes first", "conflict");
      fail(error, "deleteCompetition");
    }
  }

  async saveTeam(data: TeamData): Promise<Team> {
    const { id, ...fields } = data;
    const op = id
      ? this.db.from("teams").update(fields).eq("id", id).select("*").single()
      : this.db.from("teams").insert(fields).select("*").single();
    const { data: row, error } = await op;
    if (error) {
      if (error.code === "23505") throw new RepositoryError("A team with this name already exists in the competition", "conflict");
      fail(error, "saveTeam");
    }
    return row as Team;
  }

  async deleteTeam(id: string): Promise<Team | null> {
    const { data, error } = await this.db.from("teams").delete().eq("id", id).select("*");
    if (error) {
      if (error.code === "23503") throw new RepositoryError("This team is used by one or more episodes", "conflict");
      fail(error, "deleteTeam");
    }
    return ((data as Team[])[0] ?? null);
  }

  async createContactMessage(msg: Pick<ContactMessage, "name" | "email" | "subject" | "message">) {
    // Visitors have no insert permission; the server stores validated messages with the service role.
    const client = this.service ?? this.db;
    const { error } = await client.from("contact_messages").insert(msg);
    if (error) fail(error, "createContactMessage");
  }

  async listContactMessages(): Promise<ContactMessage[]> {
    const { data, error } = await this.db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) fail(error, "listContactMessages");
    return data as ContactMessage[];
  }

  async setContactMessageRead(id: string, isRead: boolean) {
    const { error } = await this.db.from("contact_messages").update({ is_read: isRead }).eq("id", id);
    if (error) fail(error, "setContactMessageRead");
  }

  async deleteContactMessage(id: string) {
    const { error } = await this.db.from("contact_messages").delete().eq("id", id);
    if (error) fail(error, "deleteContactMessage");
  }

  async stats(): Promise<DashboardStats> {
    const [cats, eps, unread] = await Promise.all([
      this.listCategories(),
      this.db.from("episodes").select("category_id,is_published,is_premium,is_demo,published_at"),
      this.db.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);
    if (eps.error) fail(eps.error, "stats");
    if (unread.error) fail(unread.error, "stats");
    const rows = eps.data as Pick<Episode, "category_id" | "is_published" | "is_premium" | "is_demo" | "published_at">[];
    const now = Date.now();
    const live = (e: (typeof rows)[number]) => e.is_published && !!e.published_at && Date.parse(e.published_at) <= now;
    return {
      total: rows.length,
      published: rows.filter(live).length,
      drafts: rows.filter((e) => !e.is_published).length,
      scheduled: rows.filter((e) => e.is_published && !live(e)).length,
      premium: rows.filter((e) => e.is_premium).length,
      demo: rows.filter((e) => e.is_demo).length,
      unreadMessages: unread.count ?? 0,
      byCategory: cats.map((category) => ({ category, count: rows.filter((e) => e.category_id === category.id).length })),
    };
  }
}
