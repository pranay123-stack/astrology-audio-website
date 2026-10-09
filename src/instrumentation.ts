/**
 * Runs once when the server starts. In production it refuses to start with a
 * dangerous configuration (for example a build that silently fell back to local
 * file storage) instead of serving a broken site.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { enforceProductionEnv } = await import("./lib/env-check");
  enforceProductionEnv();
}
