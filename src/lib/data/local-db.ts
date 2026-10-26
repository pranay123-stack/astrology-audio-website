import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Category, Competition, ContactMessage, CricketMatch, Episode, Profile, Team } from "../types";

/** Local mode keeps the article bodies on the episode record itself. */
export type LocalEpisode = Episode & { article: string; article_alt: string };

export interface LocalDatabase {
  version: 1;
  profile: Profile;
  categories: Category[];
  competitions: Competition[];
  teams: Team[];
  episodes: LocalEpisode[];
  cricket_matches: CricketMatch[];
  contact_messages: ContactMessage[];
}

/**
 * A JSON-file store for local development. Every read loads the file, so edits made
 * by the seed script are visible without a restart. Writes are serialised through a
 * promise chain and replace the file atomically (write temp file, then rename).
 */
export class LocalDb {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly dir: string) {}

  get file(): string {
    return path.join(this.dir, "db.json");
  }

  async read(): Promise<LocalDatabase> {
    let raw: string;
    try {
      raw = await readFile(/*turbopackIgnore: true*/ this.file, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Local database not found at ${this.file}. Run \`npm run seed\` to create it (see README → Local mode).`,
        );
      }
      throw err;
    }
    const db = JSON.parse(raw) as LocalDatabase;
    // Databases created before articles / translations / video existed lack these fields.
    for (const e of db.episodes) {
      e.article ??= "";
      e.article_alt ??= "";
      e.article_lang ??= "hi";
      e.title_alt ??= "";
      e.excerpt_alt ??= "";
      e.description_alt ??= "";
      e.has_article = e.article.trim().length > 0;
      e.has_article_alt = e.article_alt.trim().length > 0;
      e.video_storage_path ??= null;
      e.video_mime_type ??= null;
      e.video_format ??= "video";
      e.video_link ??= "";
      e.audio_link ??= "";
      e.gallery_paths ??= [];
    }
    for (const c of db.categories) {
      c.name_hi ??= "";
      c.description_hi ??= "";
      c.requires_match ??= c.slug === "cricket-astrology";
    }
    db.profile.hi ??= {};
    return db;
  }

  async write(db: LocalDatabase): Promise<void> {
    await mkdir(/*turbopackIgnore: true*/ this.dir, { recursive: true });
    const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(db, null, 2));
    await rename(/*turbopackIgnore: true*/ tmp, this.file);
  }

  /** Runs `fn` against the latest data and persists the result; calls are serialised. */
  mutate<T>(fn: (db: LocalDatabase) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      await this.write(db);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
