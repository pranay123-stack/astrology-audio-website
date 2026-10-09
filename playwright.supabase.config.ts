import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

/**
 * Runs the same end-to-end suite in Supabase mode against the local Supabase stack.
 * Use `npm run test:e2e:supabase`, which resets and seeds the database, builds in
 * Supabase mode, then runs this config (order matters: pages are prerendered from
 * the data present at build time).
 */
const env = {
  NEXT_PUBLIC_DATA_BACKEND: "supabase",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

export default defineConfig({
  ...base,
  webServer: {
    command: "npx next start -p 3461",
    url: "http://localhost:3461",
    reuseExistingServer: false,
    timeout: 120_000,
    env,
  },
});
