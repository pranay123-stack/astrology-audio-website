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
  // General astrology leads; cricket is further down the page for visitors who scroll.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cricket Predictions & Life Astrology");
  await expect(page.getByTestId("hero-latest").filter({ visible: true })).toContainText("Latest reading");
  const order = await page.evaluate(() =>
    ["featured-heading", "cricket-heading", "kp-promo-heading", "mantra-heading", "about-heading"].map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -1),
  );
  expect(order.every((y, i) => y > 0 && (i === 0 || y > order[i - 1]))).toBe(true);
  // The astrologer's menu; Premium shows only because the sample content has premium posts.
  const nav = await page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).getByRole("link").allInnerTexts();
  expect(nav).toEqual(["Astrology", "Astro Cricket", "Book", "Horoscope Research", "Premium", "Make Your KP Chart", "Contact", "Rules", "Testimonials"]);
  // The hero's main button is the course; the KP chart has its own invitation.
  await expect(page.getByTestId("hero-learn")).toHaveAttribute("href", "/contact?subject=Learning%20cricket%20astrology#questionnaire");
  await expect(page.getByTestId("kp-promo").getByRole("link")).toHaveAttribute("href", "/kp-chart");
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest in Astrology" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cricket Astrology", exact: true })).toBeVisible();
  await expect(page.getByTestId("match-card").filter({ visible: true })).toHaveCount(3);
  // The menu lists every section, so the page doesn't repeat it: one featured post with the next ones beside it,
  // the KP chart and the book side by side, and the daily mantra.
  await expect(page.getByTestId("home-explore")).toHaveCount(0);
  await expect(page.getByTestId("hero-kp")).toHaveAttribute("href", "/kp-chart");
  await expect(page.getByTestId("hero-stats")).toContainText("lessons & videos");
  await expect(page.getByTestId("home-more-latest").locator("li")).toHaveCount(4);
  await expect(page.getByTestId("home-book").getByRole("link", { name: "Listen & read" })).toHaveAttribute("href", "/book");
  await expect(page.getByTestId("home-mantra").getByRole("link")).toHaveAttribute("href", "/rules");
  await expect(page.getByText(/not guarantee match outcomes/).first()).toBeVisible();
});

test("Hindi site: translated interface at /hi, and the switch keeps the page and filters", async ({ page }) => {
  await gotoReady(page, "/hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("क्रिकेट भविष्यवाणी और जीवन ज्योतिष");
  const nav = await page.getByRole("navigation", { name: "मुख्य" }).filter({ visible: true }).getByRole("link").allInnerTexts();
  expect(nav).toEqual(["ज्योतिष", "एस्ट्रो क्रिकेट", "पुस्तक", "कुंडली शोध", "प्रीमियम", "अपनी KP कुंडली बनाएँ", "संपर्क", "नियम", "प्रशंसापत्र"]);
  // Menu links stay inside /hi.
  await expect(page.getByTestId("home-book").getByRole("link", { name: "सुनें और पढ़ें" })).toHaveAttribute("href", "/hi/book");
  await expect(page.getByTestId("hero-kp")).toHaveAttribute("href", "/hi/kp-chart");

  // English → Hindi on a filtered listing keeps the filters.
  await gotoReady(page, "/astrology-audios?category=planets-grahas&sort=popular");
  await page.getByTestId("language-switch").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/hi\/astrology-audios\?category=planets-grahas&sort=popular$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ज्योतिष ज्ञान");

  // Hindi → English goes back to the plain address; /en/... is never used.
  await page.getByTestId("language-switch").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/astrology-audios\?category=planets-grahas&sort=popular$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const res = await page.request.get("/en/contact", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toMatch(/\/contact$/);

  // A Hindi-only post on the English site is labelled, and links to its Hindi page.
  await gotoReady(page, "/astrology-audios/sample-article-graha");
  // Every post can be shared on WhatsApp with its title and full address.
  await expect(page.getByTestId("share-whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=.*%2Fastrology-audios%2Fsample-article-graha$/);
  await expect(page.getByTestId("language-note").filter({ visible: true })).toContainText("available in Hindi only");

  // Unknown addresses get a 404 in the visitor's language.
  const missing = await page.goto("/hi/does-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("यह पेज अपनी कक्षा से भटक गया है");
});

test("Hindi first: a Hindi browser lands on the Hindi site, and a language choice is remembered", async ({ browser }) => {
  const context = await browser.newContext({ locale: "hi-IN", extraHTTPHeaders: { "accept-language": "hi-IN,hi;q=0.9,en;q=0.8" } });
  const page = await context.newPage();
  await gotoReady(page, "/about");
  await expect(page).toHaveURL(/\/hi\/about$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  // Choosing English sticks, even on the next full visit.
  await page.getByTestId("language-switch").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await gotoReady(page, "/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await context.close();

  // A page served from the CDN cache never reaches the server: the browser itself switches to Hindi.
  // (The header says English, so the server does not redirect; the browser language is Hindi.)
  const cached = await browser.newContext({ locale: "hi-IN", extraHTTPHeaders: { "accept-language": "en-US" } });
  const cachedPage = await cached.newPage();
  await cachedPage.goto("/contact");
  await expect(cachedPage).toHaveURL(/\/hi\/contact$/);
  await cached.close();

  // Search engines and English browsers are never redirected, and the redirect is never cached.
  const plain = await (await browser.newContext()).request.get("/about", { maxRedirects: 0 });
  expect(plain.status()).toBe(200);
  const hindi = await (await browser.newContext()).request.get("/about", { maxRedirects: 0, headers: { "accept-language": "hi", accept: "text/html" } });
  expect(hindi.status()).toBe(307);
  expect(hindi.headers()["cache-control"]).toContain("no-store");
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
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
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
  // Only the filtered listing cards: banners elsewhere on the page come from the build-time prerender.
  const ids = new Set<string>();
  for (const url of ["/astrology-audios?access=premium", "/cricket-astrology?access=premium&when=all"]) {
    await gotoReady(page, url);
    for (const card of await page.locator("[data-testid=match-card], [data-testid=episode-card]").filter({ visible: true }).all()) {
      ids.add((await card.getAttribute("data-episode-id"))!);
    }
  }
  expect(ids.size).toBe(2); // the two sample premium episodes
  for (const id of ids) {
    const res = await request.get(`/api/media/audio/${id}`, { maxRedirects: 0 });
    expect(res.status()).toBe(403);
  }
});

test("cricket page searches by team and splits upcoming and past matches", async ({ page }) => {
  await gotoReady(page, "/cricket-astrology");
  // The next-match card with its countdown now leads the cricket page.
  const next = page.getByTestId("hero-match").filter({ visible: true });
  await expect(next).toContainText("Next match prediction");
  await expect(next.getByTestId("countdown")).toBeVisible();
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

  // Type filter: only the types that exist are offered (the sample content has audio and articles).
  await gotoReady(page, "/astrology-audios");
  const chips = page.getByTestId("format-chips").filter({ visible: true });
  await expect(chips.getByRole("link")).toHaveText(["All", "Articles", "Audio"]);
  await chips.getByRole("link", { name: "Articles" }).click();
  await expect(page).toHaveURL(/\/astrology-audios\?format=article$/);
  const articleCards = page.getByTestId("episode-card").filter({ visible: true });
  await expect(articleCards.first()).toBeVisible();
  for (const card of await articleCards.all()) await expect(card.getByTestId("article-badge")).toBeVisible();
  await gotoReady(page, "/astrology-audios?format=audio");
  const audioCards = page.getByTestId("episode-card").filter({ visible: true });
  await expect(audioCards.first()).toBeVisible();
  await expect(audioCards.filter({ hasText: "Sample: Hindi Article (Planets)" })).toHaveCount(0);
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
  await expect(page.getByTestId("mobile-learn")).toBeVisible();
  await page.locator("#mobile-menu").getByRole("link", { name: "Astro Cricket", exact: true }).click();
  await expect(page).toHaveURL(/\/astro-cricket$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  // Sub-menus open as an accordion.
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByTestId("mobile-toggle-research").click();
  await page.locator("#mobile-menu").getByRole("link", { name: "IPL", exact: true }).click();
  await expect(page).toHaveURL(/\/horoscope-research\/matches\?competition=ipl$/);
  await expect(page.getByTestId("topic-tabs").getByRole("link", { name: /IPL/ })).toHaveAttribute("aria-current", "page");
});

test("site menu: dropdowns lead to each section's pages, with their content", async ({ page }) => {
  await gotoReady(page, "/");
  const main = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
  await main.getByRole("listitem").filter({ hasText: "Astrology" }).first().hover();
  const panel = page.getByTestId("menu-panel-astrology");
  await expect(panel.getByRole("link")).toHaveText(["Overview", "12 Planets & 12 Bhav", "Video", "Audio", "Read", "KP Astrology", "Research Kundli with Match Data"]);
  await panel.getByRole("link", { name: "Read", exact: true }).click();
  await expect(page).toHaveURL(/\/astrology\/planets-bhav\?format=article$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("12 Planets & 12 Bhav");
  await expect(page.getByTestId("topic-tabs").getByRole("link", { name: /Read/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("topic-posts").getByTestId("episode-card").first()).toBeVisible();

  // The arrow button opens a menu on touch screens too.
  await page.getByTestId("menu-toggle-book").click();
  await expect(page.getByTestId("menu-panel-book").getByRole("link")).toHaveText(["Overview", "Audio (Hindi)", "Audio (English)", "PDF (Hindi)", "PDF (English)"]);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("menu-panel-book")).toHaveCount(0);

  // Each section has a page with a hero and cards for its sub-pages.
  await gotoReady(page, "/astrology");
  await expect(page.getByTestId("hub-planets-bhav")).toContainText("12 Planets & 12 Bhav");
  await gotoReady(page, "/astro-cricket");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Astro Cricket");
  await expect(page.getByTestId("hub-old-videos")).toBeVisible();
  await gotoReady(page, "/book");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A Spiritual Punter, Bookie & Astrologer");
  for (const id of ["audio-hindi", "audio-english", "pdf-hindi", "pdf-english"]) await expect(page.getByTestId(`book-${id}`)).toBeVisible();
  await gotoReady(page, "/horoscope-research/matches?competition=bbl");
  await expect(page.getByTestId("topic-posts").getByTestId("episode-card").first()).toBeVisible();
  await gotoReady(page, "/horoscope-research/players");
  await expect(page.getByTestId("empty-state")).toBeVisible();

  // The astrologer's rules, in his words: 7 spiritual (with planet and chakra), 9 cricket, 9 Shani.
  await page.getByTestId("menu-toggle-rules").click();
  await page.getByTestId("menu-panel-rules").getByRole("link", { name: "Shani Rules" }).click();
  await expect(page).toHaveURL(/\/rules#shani$/);
  await expect(page.getByTestId("rules-spiritual").getByTestId("rule")).toHaveCount(7);
  await expect(page.getByTestId("rules-cricket").getByTestId("rule")).toHaveCount(9);
  await expect(page.getByTestId("rules-shani").getByTestId("rule")).toHaveCount(9);
  await expect(page.getByTestId("rules-spiritual").getByTestId("rule").first()).toContainText("Mooladhar Chakra");
  await expect(page.getByTestId("rules-cricket")).toContainText("LPL or CPL");
  await expect(page.getByTestId("rules-shani").getByTestId("rule").last()).toContainText("Sab ho raha hai, I am doing nothing.");
});

test("KP chart: birth details give a South Indian chart whose items open in the centre box, and can be edited", async ({ page }) => {
  await gotoReady(page, "/kp-chart");
  await page.fill("#kp-name", "Public test");
  await page.fill("#kp-date", "2000-01-01");
  await page.fill("#kp-time", "17:30:00");
  await page.locator("summary").click();
  await page.fill("#kp-lat", "28.6139");
  await page.fill("#kp-lon", "77.2090");
  await page.getByTestId("kp-submit").click();
  const chart = page.getByTestId("kp-chart");
  await expect(chart).toBeVisible({ timeout: 30_000 });
  // 1 Jan 2000, 12:00 UT: KP New mean ayanamsa is exactly 23°46'00", shown as 23°45'59".
  await expect(chart).toContainText(`KP New | 23°45'59"`);
  // 13 planets and 12 cusps, each its own button inside the 12 sign boxes.
  await expect(page.getByTestId("kp-grid").locator("button")).toHaveCount(25);
  await expect(page.getByTestId("kp-planets-table").locator("tbody tr")).toHaveCount(13);
  await expect(page.getByTestId("kp-aspects-table").locator("tbody tr")).toHaveCount(9);
  await expect(page.getByTestId("kp-strength-table")).toContainText("Opposition lords");
  // The header shows the birth moment, the ascendant and the coordinates.
  await expect(page.getByTestId("kp-header")).toContainText("True Asc");
  await expect(page.getByTestId("kp-header")).toContainText("28.6139°N, 77.2090°E");

  // Picking a house ranks its significators with their levels.
  await page.getByTestId("kp-house-select").selectOption("1");
  await expect(page.getByTestId("kp-strength-table")).toContainText("Rank");
  await expect(page.getByTestId("kp-strength-table").locator("tbody tr").first()).toContainText(/L[1-4]/);
  await page.getByTestId("kp-house-select").selectOption("0");
  await expect(page.getByTestId("kp-strength-table").locator("tbody tr")).toHaveCount(9);

  // Tapping a cusp shows its details inside the chart's centre box; Back restores the centre.
  const details = page.getByTestId("kp-details");
  await expect(details).toContainText("Public test");
  await expect(details).toContainText("28.6139°N, 77.2090°E");
  await page.getByTestId("kp-item-c1").click();
  await expect(page.getByTestId("kp-item-c1")).toHaveAttribute("aria-pressed", "true");
  await expect(details).toContainText(/^I – \w+ \d\d°\d\d'\d\d"/);
  await expect(details).toContainText("Sub lord");
  await page.getByTestId("kp-item-Mo").click();
  await expect(details).toContainText(/^Mo – /);
  await page.getByTestId("kp-details-back").click();
  await expect(details).toContainText("Public test");

  await expect(page.getByTestId("kp-dasha").locator("li")).not.toHaveCount(0);

  // Editing reopens the form with the same details; changing the time redraws the chart.
  await page.getByTestId("kp-actions").click();
  await page.getByTestId("kp-edit").click();
  await expect(page.locator("#kp-name")).toHaveValue("Public test");
  await expect(page.locator("#kp-time")).toHaveValue("17:30:00");
  await page.fill("#kp-time", "05:30:00");
  await page.getByTestId("kp-submit").click();
  await expect(chart).toContainText(/05:30:00 am/i, { timeout: 30_000 });

  // Starting over returns to an empty form.
  await page.getByTestId("kp-actions").click();
  await page.getByTestId("kp-new-chart").click();
  await expect(page.getByTestId("kp-form")).toBeVisible();
  await expect(page.locator("#kp-name")).toHaveValue("");
});

test("KP chart: the new-chart page shows the form", async ({ page }) => {
  await gotoReady(page, "/kp-chart/new");
  await expect(page.getByTestId("kp-form")).toBeVisible();
  await expect(page.getByTestId("kp-submit")).toBeVisible();
});

test("KP chart: a saved chart's link that is private or missing says so", async ({ page }) => {
  await gotoReady(page, "/kp-chart/00000000-0000-4000-8000-000000000000");
  await expect(page.getByTestId("kp-link-state")).toContainText("This chart is private or no longer exists.", { timeout: 15_000 });
  await page.getByTestId("kp-link-state").getByRole("button", { name: "New chart" }).click();
  await expect(page.getByTestId("kp-form")).toBeVisible();
  await expect(page).toHaveURL(/\/kp-chart$/);
});
