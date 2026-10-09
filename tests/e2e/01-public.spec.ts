import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "./helpers";

const audioTime = (page: Page) => page.evaluate(() => (document.querySelector("[data-testid=site-audio]") as HTMLAudioElement).currentTime);
const audioState = (page: Page) =>
  page.evaluate(() => {
    const a = document.querySelector("[data-testid=site-audio]") as HTMLAudioElement;
    return { paused: a.paused, rate: a.playbackRate, time: a.currentTime, duration: a.duration };
  });

test("home page shows the main sections and the sample-content notice", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("BBL Match Predictions");
  // The hero leads with the next BBL match prediction, with a live countdown and a play button.
  const hero = page.getByTestId("hero-match").filter({ visible: true });
  await expect(hero).toContainText("Next match prediction");
  await expect(hero).toContainText("Demo Team A");
  await expect(hero.getByTestId("countdown")).toBeVisible();
  await expect(hero.getByTestId("play-button")).toBeVisible();
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured Audio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cricket Astrology Predictions" })).toBeVisible();
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(3);
  await expect(page.getByTestId("category-tile").filter({ visible: true })).toHaveCount(7);
  await expect(page.getByText(/not guarantee match outcomes/).first()).toBeVisible();
});

test("audio really plays, survives navigation, and honours speed and seek", async ({ page }) => {
  await gotoReady(page, "/astrology-audios/sample-daily-astrology-reading");
  await page.getByTestId("episode-play").filter({ visible: true }).click();
  const mini = page.getByTestId("mini-player");
  await expect(mini).toBeVisible();
  await expect(mini.getByTestId("mini-player-title")).toHaveText("Sample: Daily Astrology Reading");
  await expect.poll(() => audioTime(page), { timeout: 10_000 }).toBeGreaterThan(1);

  const state = await audioState(page);
  expect(state.paused).toBe(false);
  expect(Math.round(state.duration)).toBe(48);

  await mini.getByLabel("Playback speed").selectOption("1.5");
  expect((await audioState(page)).rate).toBe(1.5);

  // Navigate with the header link: the same audio element keeps playing.
  const before = await audioTime(page);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About Astrologer" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(mini).toBeVisible();
  await expect.poll(() => audioTime(page)).toBeGreaterThan(before + 0.5);

  // Seek and pause.
  await mini.getByLabel("Seek").fill("30");
  await expect.poll(() => audioTime(page)).toBeGreaterThanOrEqual(30);
  await mini.getByTestId("mini-player-toggle").click();
  await expect.poll(async () => (await audioState(page)).paused).toBe(true);
});

test("premium audio is locked in the UI and refused by the server", async ({ page, request }) => {
  await gotoReady(page, "/astrology-audios/sample-vedic-astrology-nakshatras");
  await expect(page.getByTestId("locked-player").filter({ visible: true })).toBeVisible();
  await expect(page.getByTestId("episode-play").filter({ visible: true })).toHaveCount(0);

  // The locked player sends visitors to the astrologer for the full package.
  await page.getByTestId("premium-contact").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/contact\?subject=Premium/);
  await expect(page.getByTestId("premium-note")).toContainText("Introduction to Nakshatras");
  await expect(page.getByLabel(/Subject/)).toHaveValue("Premium package: Sample: Introduction to Nakshatras");

  // Hiding the button is not the protection: the audio route itself refuses premium audio.
  // Filtered listings render at request time, so these ids reflect the current data.
  let html = "";
  for (const url of ["/astrology-audios?access=premium", "/cricket-astrology?access=premium&when=all"]) {
    await gotoReady(page, url);
    html += await page.content();
  }
  const ids = [...new Set([...html.matchAll(/\/api\/media\/audio\/([0-9a-f-]{36})/g)].map((m) => m[1]))];
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    const res = await request.get(`/api/media/audio/${id}`, { maxRedirects: 0 });
    expect(res.status()).toBe(403);
  }
});

test("cricket page searches by team and splits upcoming and past matches", async ({ page }) => {
  await gotoReady(page, "/cricket-astrology");
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(3);
  await page.getByLabel("Search team or match").fill("Demo Team C");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/q=Demo\+Team\+C/);
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(2);

  await gotoReady(page, "/cricket-astrology?when=past");
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByTestId("match-card").filter({ visible: true })).toContainText("Demo Team D");

  await gotoReady(page, "/cricket-astrology?access=premium&when=all");
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(1);

  await gotoReady(page, "/cricket-astrology?q=zzzz-nothing");
  await expect(page.getByTestId("empty-state").filter({ visible: true })).toBeVisible();
});

test("general page filters by category and keyword", async ({ page }) => {
  await gotoReady(page, "/astrology-audios?category=daily-astrology");
  await expect(page.getByRole("heading", { name: "Daily Astrology", level: 2 })).toBeVisible();
  await expect(page.getByTestId("episode-card").filter({ visible: true })).toHaveCount(2);
  await gotoReady(page, "/astrology-audios?q=nakshatras");
  await expect(page.getByTestId("episode-card").filter({ visible: true })).toHaveCount(1);
});

test("a missing audio file shows a helpful error", async ({ page }) => {
  await page.route("**/api/media/audio/**", (route) => route.fulfill({ status: 404, body: '{"error":"Audio file is unavailable"}', contentType: "application/json" }));
  await gotoReady(page, "/astrology-audios/sample-full-moon-meditation");
  await page.getByTestId("episode-play").filter({ visible: true }).click();
  await expect(page.getByTestId("player-error")).toContainText("unavailable");
});

test("mobile menu opens and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Cricket Astrology" }).click();
  await expect(page).toHaveURL(/\/cricket-astrology$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
});
