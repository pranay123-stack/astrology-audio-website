import { defineConfig } from "vitest/config";

/** Database policy tests. Needs a running local Supabase (`npm run db:start`) and its keys in the environment. */
export default defineConfig({
  test: { include: ["tests/supabase/**/*.test.ts"], environment: "node", testTimeout: 30_000, fileParallelism: false },
});
