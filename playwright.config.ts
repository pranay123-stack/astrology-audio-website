import { randomBytes, scryptSync } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`npm run build` first) in local
 * mode with their own throwaway data directory, so they never touch .data/.
 */
export const E2E_ADMIN = { email: "e2e-admin@example.com", password: "e2e-Password-123" };

const salt = randomBytes(16);
const hash = scryptSync(E2E_ADMIN.password, salt, 32, { N: 16384, r: 8, p: 1 });
const passwordHash = ["scrypt", 16384, 8, 1, salt.toString("base64url"), hash.toString("base64url")].join(".");
const PORT = 3461;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx tsx scripts/seed.ts --reset && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_DATA_BACKEND: "local",
      ALLOW_LOCAL_BACKEND_IN_PRODUCTION: "true",
      LOCAL_DATA_DIR: ".data-e2e",
      SESSION_SECRET: randomBytes(32).toString("base64url"),
      ADMIN_EMAIL: E2E_ADMIN.email,
      ADMIN_PASSWORD_HASH: passwordHash,
    },
  },
});
