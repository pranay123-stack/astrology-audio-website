import { connection } from "next/server";
import { getDataBackend } from "@/lib/config";
import { getPublicRepository } from "@/lib/data";

/**
 * Health check for the hosting platform and uptime monitors. Reports whether the
 * database is reachable without revealing configuration or error details.
 */
export async function GET() {
  await connection();
  const started = Date.now();
  let database: "ok" | "error" = "ok";
  try {
    await getPublicRepository().listCategories();
  } catch (err) {
    database = "error";
    console.error("health check: database unreachable", err instanceof Error ? err.message : "unknown error");
  }
  const ok = database === "ok";
  return Response.json(
    { status: ok ? "ok" : "degraded", backend: getDataBackend(), database, latencyMs: Date.now() - started, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
