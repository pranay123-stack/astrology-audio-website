import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";

/** Loads .env, .env.local, etc. the same way `next dev` does. */
export function loadEnv(): void {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
}

/** Deterministic, uuid-shaped id so re-seeding overwrites the same media objects. */
export function stableUuid(name: string): string {
  const h = createHash("sha256").update(name).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
