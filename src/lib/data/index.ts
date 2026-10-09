import "server-only";
import { getDataBackend, localPaths } from "../config";
import { LocalRepository } from "./local";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabase";
import { createAnonClient, createServiceClient, createSessionClient } from "./supabase-clients";

let local: LocalRepository | null = null;
function localRepo(): LocalRepository {
  local ??= new LocalRepository(localPaths.dataDir);
  return local;
}

/**
 * Repository for public pages. In Supabase mode it uses the anonymous key and no
 * cookies, so RLS limits it to published content and it is safe to call from
 * `use cache` functions.
 */
export function getPublicRepository(): Repository {
  if (getDataBackend() === "local") return localRepo();
  return new SupabaseRepository(createAnonClient());
}

/** Repository for public writes that visitors may not perform directly (contact form). */
export function getServerRepository(): Repository {
  if (getDataBackend() === "local") return localRepo();
  return new SupabaseRepository(createAnonClient(), createServiceClient());
}

/**
 * Repository for admin operations. Callers must have verified the admin session
 * first (see lib/auth/admin.ts). In Supabase mode RLS enforces it a second time.
 */
export async function getAdminRepository(): Promise<Repository> {
  if (getDataBackend() === "local") return localRepo();
  return new SupabaseRepository(await createSessionClient());
}

export { RepositoryError } from "./repository";
export type { Repository, EpisodeWrite, DashboardStats } from "./repository";
