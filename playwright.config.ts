import { randomBytes, scryptSync } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests seed a throwaway data directory (.data-e2e), build the app
 * against it, and run against that production build in local mode. Never touches .data/.
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
  // A wide desktop window, where the whole menu fits in the header (narrower windows get the ☰ Menu button).
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1700, height: 900 } } }],
  webServer: {
    // Build against the freshly seeded test data so prerendered pages match the data under test.
    command: `npx tsx scripts/seed.ts --reset && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
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
