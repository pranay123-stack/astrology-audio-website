import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "./helpers";
import { readFileSync } from "node:fs";
import { E2E_ADMIN } from "../../playwright.config";

test.describe.configure({ mode: "serial" });

// A valid 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: Page) {
  await gotoReady(page, "/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test("signed-out visitors are sent to the login page and wrong passwords fail", async ({ page }) => {
  await gotoReady(page, "/admin/episodes");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("login-error")).toContainText("Incorrect");
});

test("contact form message reaches the admin inbox", async ({ page }) => {
  await gotoReady(page, "/contact");
  await page.getByLabel("Your name").fill("Test Visitor");
  await page.getByLabel("Email").fill("visitor@example.com");
  await page.getByLabel("Message").fill("I would like to book a consultation please.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByTestId("contact-success")).toBeVisible();

  await login(page);
  await gotoReady(page, "/admin/messages");
  await expect(page.getByTestId("message").first()).toContainText("I would like to book a consultation");
});

test("admin creates, publishes, previews and unpublishes an episode", async ({ page, request }) => {
  await login(page);
  await expect(page.getByTestId("stats")).toContainText("Total episodes");
  await gotoReady(page, "/admin/episodes/new");

  await page.getByLabel("Title").fill("E2E Saturn Transit Reading");
  await expect(page.getByLabel("URL slug")).toHaveValue("e2e-saturn-transit-reading");
  await page.getByLabel("Category").selectOption({ label: "Planetary Transits" });
  await page.getByLabel("Short description").fill("An end-to-end test episode about Saturn.");

  // A disguised file is rejected by the server after upload.
  await page.getByTestId("audio-input").setInputFiles({ name: "fake.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("this is not audio at all") });
  await expect(page.getByRole("alert").filter({ hasText: /could not read|do not match/ })).toBeVisible();

  // A real file uploads, reports its duration, and can be previewed.
  await page.getByTestId("audio-input").setInputFiles({ name: "tone.mp3", mimeType: "audio/mpeg", buffer: readFileSync("seed/media/demo-tone-a.mp3") });
  await expect(page.getByTestId("audio-ready")).toBeVisible();
  await expect(page.getByLabel("Seconds")).toHaveValue("48");
  await expect(page.getByTestId("admin-audio-preview")).toBeVisible();
  await page.getByTestId("cover-input").setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByTestId("cover-ready")).toBeVisible();

  // Save as a draft first.
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);
  const id = /episodes\/([0-9a-f-]{36})/.exec(page.url())![1];

  // Drafts: hidden from the public, previewable by the admin.
  expect((await request.get(`/api/media/audio/${id}`)).status()).toBe(404);
  const adminPreview = await page.request.get(`/api/media/audio/${id}`, { headers: { range: "bytes=0-9" } });
  expect(adminPreview.status()).toBe(206);
  await gotoReady(page, "/astrology-audios/e2e-saturn-transit-reading");
  await expect(page.getByText("drifted out of orbit")).toBeVisible();

  // Publish from the list.
  await gotoReady(page, "/admin/episodes?q=E2E");
  const row = page.getByTestId("episode-row").filter({ visible: true }).filter({ hasText: "E2E Saturn" });
  await row.getByTestId("toggle-publish").click();
  await expect(row).toContainText("Live");

  await gotoReady(page, "/astrology-audios?category=planetary-transits");
  await expect(page.getByTestId("episode-card").filter({ visible: true }).filter({ hasText: "E2E Saturn Transit Reading" })).toBeVisible();
  expect((await request.get(`/api/media/audio/${id}`)).status()).toBe(200);

  await gotoReady(page, "/astrology-audios/e2e-saturn-transit-reading");
  await page.getByTestId("episode-play").filter({ visible: true }).click();
  await expect
    .poll(() => page.evaluate(() => (document.querySelector("[data-testid=site-audio]") as HTMLAudioElement).currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0.5);

  // Unpublish: gone from the site and the audio route.
  await gotoReady(page, "/admin/episodes?q=E2E");
  await page.getByTestId("episode-row").filter({ visible: true }).filter({ hasText: "E2E Saturn" }).getByTestId("toggle-publish").click();
  await expect(page.getByTestId("episode-row").filter({ visible: true }).filter({ hasText: "E2E Saturn" })).toContainText("Draft");
  expect((await request.get(`/api/media/audio/${id}`)).status()).toBe(404);

  // Delete.
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("episode-row").filter({ visible: true }).filter({ hasText: "E2E Saturn" }).getByTestId("delete-episode").click();
  await expect(page.getByTestId("episode-row").filter({ visible: true }).filter({ hasText: "E2E Saturn" })).toHaveCount(0);
});

test("cricket episode requires match details and appears on the cricket page", async ({ page }) => {
  await login(page);
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Sixers v Heat Reading");
  await page.getByLabel("Category").selectOption({ label: "Cricket Astrology" });
  await expect(page.getByTestId("match-fields")).toBeVisible();
  await page.getByLabel("Short description").fill("An end-to-end cricket reading test.");
  await page.getByTestId("audio-input").setInputFiles({ name: "tone.mp3", mimeType: "audio/mpeg", buffer: readFileSync("seed/media/demo-tone-b.mp3") });
  await expect(page.getByTestId("audio-ready")).toBeVisible();
  await page.getByTestId("publish-checkbox").check();

  // Same team twice is refused.
  await page.getByLabel("Team A").selectOption({ label: "Sydney Sixers" });
  await page.getByLabel("Team B").selectOption({ label: "Sydney Sixers" });
  await page.getByLabel(/Match start/).fill("2030-01-05T19:15");
  await page.getByTestId("save-episode").click();
  await expect(page.getByText("Team A and Team B must be different")).toBeVisible();

  await page.getByLabel("Team B").selectOption({ label: "Brisbane Heat" });
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  await gotoReady(page, "/cricket-astrology?q=heat");
  const card = page.getByTestId("match-card").filter({ visible: true }).filter({ hasText: "E2E Sixers v Heat" });
  await expect(card).toBeVisible();
  // 7:15 pm Sydney time, shown in the site timezone.
  await expect(card).toContainText("7:15");
  await expect(card).toContainText("Sydney Sixers");
});

test("profile edits appear on the public about page", async ({ page }) => {
  await login(page);
  await gotoReady(page, "/admin/profile");
  await page.getByLabel("Display name").fill("E2E Astrologer");
  await page.getByLabel("Business or trading name").fill("E2E Astro Pty Ltd");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
  await gotoReady(page, "/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Astrologer");
  await gotoReady(page, "/terms");
  await expect(page.getByText("E2E Astro Pty Ltd").first()).toBeVisible();
});

test("removing sample content clears the demo banner", async ({ page }) => {
  await login(page);
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("remove-demo").click();
  await expect(page.getByTestId("remove-demo")).toHaveCount(0);
  await gotoReady(page, "/");
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await gotoReady(page, "/cricket-astrology?when=all");
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(1); // only the E2E reading remains
});

test("admin pages fit a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  for (const path of ["/admin", "/admin/episodes", "/admin/episodes/new", "/admin/profile", "/admin/leagues", "/admin/messages"]) {
    await gotoReady(page, path);
    // Nothing may extend past the right edge, except the scrollable nav and the episodes table.
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll("main *")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && !el.closest("nav, table, .overflow-x-auto") && r.right > innerWidth + 1;
      }).length,
    );
    expect(clipped, path).toBe(0);
  }
});

test("sign out ends the session", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await gotoReady(page, "/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
