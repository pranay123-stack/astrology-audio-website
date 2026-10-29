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

test("admin publishes a Hindi article-only post; premium article text never reaches visitors", async ({ page, request }) => {
  const ARTICLE = "## शनि ग्रह\n\nयह **परीक्षण** लेख है।\n\n- पहला बिंदु\n- दूसरा बिंदु";
  await login(page);
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Shani Lekh");
  await page.getByLabel("Category").selectOption({ label: "Planets (Grahas)" });
  await page.getByLabel("Short description").fill("A Hindi article about Shani, no audio.");
  await page.getByLabel("Article text").fill(ARTICLE);
  await page.getByTestId("article-preview-toggle").click();
  await expect(page.getByTestId("article-preview").locator("h2")).toHaveText("शनि ग्रह");
  await expect(page.getByTestId("article-preview").locator("li")).toHaveCount(2);
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  // Listing: Article badge and a Read button instead of play.
  await gotoReady(page, "/astrology-audios?category=planets-grahas");
  const card = page.getByTestId("episode-card").filter({ visible: true, hasText: "E2E Shani Lekh" });
  await expect(card.getByTestId("article-badge")).toBeVisible();
  await expect(card.getByTestId("read-button")).toBeVisible();
  await expect(card.getByTestId("play-button")).toHaveCount(0);

  // Post page: formatted Hindi article, marked lang="hi", no audio player.
  await card.getByTestId("read-button").click();
  const body = page.getByTestId("article-body").filter({ visible: true });
  await expect(body).toHaveAttribute("lang", "hi");
  await expect(body.locator("h2")).toHaveText("शनि ग्रह");
  await expect(body.locator("strong")).toHaveText("परीक्षण");
  await expect(page.getByTestId("episode-play")).toHaveCount(0);

  // Premium article: visitors see the lock, and the text is not anywhere in the page.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Premium Lekh");
  await page.getByLabel("Category").selectOption({ label: "Planets (Grahas)" });
  await page.getByLabel("Short description").fill("A premium Hindi article.");
  await page.getByLabel("Article text").fill("गुप्तप्रीमियमपाठ केवल पैकेज के लिए");
  await page.getByLabel("English heading").fill("E2E Premium Article");
  await page.getByLabel("English article").fill("SecretPremiumEnglishText for the package only");
  await page.getByLabel(/Premium episode/).check();
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);
  const html = await (await request.get("/astrology-audios/e2e-premium-lekh")).text();
  expect(html).not.toContain("गुप्तप्रीमियमपाठ");
  await gotoReady(page, "/astrology-audios/e2e-premium-lekh");
  await expect(page.getByTestId("locked-article").filter({ visible: true })).toContainText("full premium package");
  expect(await page.content()).not.toContain("गुप्तप्रीमियमपाठ");
  // The translated premium article is protected the same way, on both language versions.
  for (const path of ["/astrology-audios/e2e-premium-lekh", "/hi/astrology-audios/e2e-premium-lekh"]) {
    expect(await (await request.get(path)).text()).not.toContain("SecretPremiumEnglishText");
  }
});

test("a post with an English version shows the right language on each site", async ({ page }) => {
  await login(page);
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Guru Lekh");
  await page.getByLabel("Category").selectOption({ label: "Planets (Grahas)" });
  await page.getByLabel("Short description").fill("गुरु ग्रह पर एक हिंदी लेख।");
  await page.getByLabel("Article text").fill("## गुरु\n\nहिंदी पाठ।");
  await expect(page.getByTestId("translation-fields")).toContainText("English version");
  await page.getByLabel("English heading").fill("E2E Jupiter Article");
  await page.getByLabel("English short summary").fill("An English article about Jupiter.");
  await page.getByLabel("English article").fill("## Jupiter\n\nEnglish text.");
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  // English visitors get the English version, with a link to the Hindi one.
  await gotoReady(page, "/astrology-audios/e2e-guru-lekh");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Jupiter Article");
  const enBody = page.getByTestId("article-body").filter({ visible: true });
  await expect(enBody).toHaveAttribute("lang", "en");
  await expect(enBody.locator("h2")).toHaveText("Jupiter");
  await page.getByTestId("other-language-link").filter({ visible: true }).click();

  // Hindi visitors get the main (Hindi) text.
  await expect(page).toHaveURL(/\/hi\/astrology-audios\/e2e-guru-lekh$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Guru Lekh");
  await expect(page.getByTestId("article-body").filter({ visible: true }).locator("h2")).toHaveText("गुरु");

  // Search finds the post by its translated words too.
  await gotoReady(page, "/astrology-audios?q=jupiter");
  await expect(page.getByTestId("episode-card").filter({ visible: true, hasText: "E2E Jupiter Article" })).toBeVisible();
});

test("profile edits appear on the public about page", async ({ page }) => {
  await login(page);
  await gotoReady(page, "/admin/profile");
  await page.getByLabel("Display name").fill("E2E Astrologer");
  await page.getByLabel("Business or trading name").fill("E2E Astro Pty Ltd");
  await page.getByLabel("WhatsApp link").fill("https://wa.me/918981345111");
  await page.getByLabel("Amazon").fill("https://amzn.in/d/05ZrKozx");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
  await gotoReady(page, "/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Astrologer");
  // WhatsApp on every page, and the book with its Amazon link.
  await expect(page.getByTestId("whatsapp-float")).toHaveAttribute("href", "https://wa.me/918981345111");
  await expect(page.getByTestId("book-buy")).toHaveAttribute("href", "https://amzn.in/d/05ZrKozx");
  await gotoReady(page, "/terms");
  await expect(page.getByText("E2E Astro Pty Ltd").first()).toBeVisible();
  await expect(page.getByTestId("whatsapp-float")).toBeVisible();

  // Hindi profile fields show on the Hindi site; empty ones fall back to English.
  await gotoReady(page, "/admin/profile");
  await page.locator("#hi-tagline").fill("ऑडियो के माध्यम से ज्योतिष");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
  await gotoReady(page, "/hi/about");
  await expect(page.getByText("ऑडियो के माध्यम से ज्योतिष").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Astrologer");
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

test("admin posts a reel with photos, an MP4 and a YouTube link; premium video stays locked", async ({ page, request }) => {
  test.setTimeout(150_000);
  // The tests above use up the login rate limit (10 per 15 min per client), so sign in as another client.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.0.0.25" });
  await login(page);
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Reel And Photos");
  await page.getByLabel("Category").selectOption({ label: "Vedic Astrology" });
  await page.getByLabel("Short description").fill("An end-to-end test of reels and photo galleries.");

  // A disguised file is refused; a real clip uploads and previews.
  await page.getByTestId("video-input").setInputFiles({ name: "fake.mp4", mimeType: "video/mp4", buffer: Buffer.from("definitely not a video file") });
  await expect(page.getByRole("alert").filter({ hasText: /do not match/ })).toBeVisible();
  await page.getByTestId("video-input").setInputFiles({ name: "reel.webm", mimeType: "video/webm", buffer: readFileSync("tests/fixtures/reel-clip.webm") });
  await expect(page.getByTestId("video-ready")).toBeVisible();
  await expect(page.getByTestId("admin-video-preview")).toBeVisible();
  // No cover was chosen, so a still from the video becomes the cover.
  await expect(page.getByTestId("thumb-note")).toContainText("taken from the video", { timeout: 20_000 });
  await expect(page.getByTestId("cover-ready")).toBeVisible();
  await page.getByTestId("format-reel").check();

  await page.getByTestId("gallery-input").setInputFiles([
    // Frames of the test clips: a 1x1 pixel image would not decode once resized.
    { name: "one.png", mimeType: "image/png", buffer: readFileSync("tests/fixtures/reel-frame.png") },
    { name: "two.jpg", mimeType: "image/jpeg", buffer: readFileSync("tests/fixtures/wide-frame.jpg") },
  ]);
  await expect(page.getByTestId("gallery-list").locator("li")).toHaveCount(2);

  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);
  const id = /episodes\/([0-9a-f-]{36})/.exec(page.url())![1];

  // Visitors stream the clip through the access-checked route, with byte ranges.
  const ranged = await request.get(`/api/media/video/${id}`, { headers: { range: "bytes=0-3" } });
  expect(ranged.status()).toBe(206);
  expect(ranged.headers()["content-type"]).toBe("video/webm");

  await gotoReady(page, "/astrology-audios?q=E2E%20Reel");
  const card = page.getByTestId("episode-card").filter({ visible: true }).filter({ hasText: "E2E Reel And Photos" });
  await expect(card.getByTestId("video-badge")).toContainText("Reel");
  await expect(card.getByTestId("photos-badge")).toBeVisible();
  await expect(card.getByTestId("watch-button")).toBeVisible();

  // The reel appears in the home page's reels strip, with its auto-made cover.
  await gotoReady(page, "/");
  const reel = page.getByTestId("reels-strip").getByTestId("reel-card").filter({ hasText: "E2E Reel And Photos" });
  await expect(reel).toBeVisible();
  await expect(reel.locator("img")).toHaveAttribute("src", /covers%2F/);

  await gotoReady(page, "/astrology-audios/e2e-reel-and-photos");
  const video = page.getByTestId("post-video");
  await expect(video).toBeVisible();
  // The browser really decodes it: 2-second clip, tall frame.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  expect(Math.round(await video.evaluate((v: HTMLVideoElement) => v.duration))).toBe(2);
  expect(await video.evaluate((v: HTMLVideoElement) => v.videoHeight > v.videoWidth)).toBe(true);

  const gallery = page.getByTestId("photo-gallery");
  await expect(gallery.getByRole("button", { name: /Open photo/ })).toHaveCount(2);
  // The photos really load (not just the markup). They are lazy, so bring them on screen first.
  await gallery.scrollIntoViewIfNeeded();
  await expect
    .poll(() => gallery.locator("img").evaluateAll((imgs) => imgs.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length), { timeout: 10_000 })
    .toBe(2);
  await gallery.getByRole("button", { name: "Open photo 1" }).click();
  const lightbox = page.getByTestId("photo-lightbox");
  await expect(lightbox).toContainText("1 / 2");
  await lightbox.getByRole("button", { name: "Next photo" }).click();
  await expect(lightbox).toContainText("2 / 2");
  await page.keyboard.press("Escape");
  await expect(lightbox).not.toBeVisible();

  // Same post in Hindi shows the Hindi labels.
  await gotoReady(page, "/hi/astrology-audios/e2e-reel-and-photos");
  await expect(page.getByTestId("photo-gallery")).toContainText("फ़ोटो");

  // Premium: the clip is refused to visitors and the page shows the lock instead of a player.
  await gotoReady(page, `/admin/episodes/${id}`);
  await page.getByLabel("Premium episode").check();
  await page.getByTestId("save-episode").click();
  await expect(page.getByTestId("form-message")).toContainText("saved");
  expect((await request.get(`/api/media/video/${id}`)).status()).toBe(403);
  await gotoReady(page, "/astrology-audios/e2e-reel-and-photos");
  await expect(page.getByTestId("locked-video")).toBeVisible();

  // MP4 is accepted too. (One test, one sign-in: the login is rate limited.)
  await gotoReady(page, "/admin/episodes/new");
  await page.getByTestId("video-input").setInputFiles({ name: "wide.mp4", mimeType: "video/mp4", buffer: readFileSync("tests/fixtures/wide-clip.mp4") });
  await expect(page.getByTestId("video-ready")).toBeVisible();

  // A YouTube link alone is enough to publish; unknown links are refused.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E YouTube Only");
  await page.getByLabel("Category").selectOption({ label: "Vedic Astrology" });
  await page.getByLabel("Short description").fill("A post that is only an embedded YouTube video.");
  await page.getByTestId("publish-checkbox").check();

  await page.getByLabel(/YouTube \/ Instagram link/).fill("https://vimeo.com/12345");
  await page.getByTestId("save-episode").click();
  await expect(page.getByText("Paste a YouTube or Instagram video link")).toBeVisible();

  await page.getByLabel(/YouTube \/ Instagram link/).fill("https://youtu.be/dQw4w9WgXcQ");
  await expect(page.getByTestId("video-link-ok")).toContainText("YouTube video recognised");
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  await gotoReady(page, "/astrology-audios/e2e-youtube-only");
  await expect(page.getByTestId("video-embed")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  await expect(page.getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  // Without a cover, the card uses the YouTube thumbnail.
  // Plain goto: waiting for "network idle" would wait on the external thumbnail.
  await page.goto("/astrology-audios?q=YouTube%20Only");
  await expect(page.getByTestId("episode-card").filter({ visible: true }).filter({ hasText: "E2E YouTube Only" }).locator("img")).toHaveAttribute("src", /i\.ytimg\.com/);
});

test("questionnaire (Google Form) on the contact page, Drive audiobook post, and the quote on the home page", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.0.0.26" });
  const FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdEFG/viewform?usp=sf_link";
  const DRIVE = "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view?usp=sharing";

  // The astrologer's quote sits at the top of the home page in both languages.
  await gotoReady(page, "/");
  await expect(page.getByTestId("quotes-band")).toContainText("Kundali kabhi galat nahi bolti, either human ki ho ya match ki.");
  await expect(page.getByTestId("quotes-band")).toContainText("Amit Sharma");
  await expect(page.getByTestId("quotes-band")).not.toContainText("Everything is fixed by God");
  await gotoReady(page, "/hi");
  await expect(page.getByTestId("quotes-band")).toContainText("Kundali kabhi galat nahi bolti");
  await expect(page.getByTestId("quotes-band")).toContainText("पुस्तक");

  // No form link yet: no questionnaire section.
  await gotoReady(page, "/contact");
  await expect(page.getByTestId("questionnaire")).toHaveCount(0);

  await login(page);
  await gotoReady(page, "/admin/profile");
  await page.getByLabel("Google Form link").fill("https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Paste the Google Form's link")).toBeVisible();
  await page.getByLabel("Google Form link").fill(FORM);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();

  await gotoReady(page, "/contact");
  await expect(page.getByTestId("questionnaire-embed")).toHaveAttribute(
    "src",
    "https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdEFG/viewform?embedded=true",
  );
  await gotoReady(page, "/hi/contact");
  await expect(page.getByTestId("questionnaire")).toContainText("क्रिकेट ज्योतिष सीखना");

  // A Hindi title gets a readable address, and a renamed post's old address redirects.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("सूर्य ग्रह परीक्षण");
  await expect(page.getByLabel("URL slug")).toHaveValue("surya-grah-parikshan");
  await page.getByLabel("Category").selectOption({ label: "Vedic Astrology" });
  await page.getByLabel("Short description").fill("हिंदी शीर्षक से पढ़ने योग्य वेब पता बनता है।");
  await page.getByLabel(/YouTube \/ Instagram link/).fill("https://youtu.be/dQw4w9WgXcQ");
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);
  // After saving, the "new" page stays mounted but hidden, so pick the visible form.
  await page.getByLabel("URL slug").filter({ visible: true }).fill("surya-grah-test");
  await page.getByTestId("save-episode").filter({ visible: true }).click();
  await expect(page.getByTestId("form-message").filter({ visible: true })).toContainText("saved");
  // Post pages are prerendered shells, so the status is already 200 when the redirect is known;
  // the page carries the redirect itself (refresh tag + client router), which browsers and Google follow.
  const old = await page.request.get("/astrology-audios/surya-grah-parikshan", { maxRedirects: 0 });
  expect(await old.text()).toContain("/astrology-audios/surya-grah-test");
  // People's browsers are redirected too.
  await gotoReady(page, "/astrology-audios/surya-grah-parikshan");
  await expect(page).toHaveURL(/\/astrology-audios\/surya-grah-test$/);

  // An audiobook kept in Google Drive.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Audiobook From Drive");
  await page.getByLabel("Category").selectOption({ label: "Vedic Astrology" });
  await page.getByLabel("Short description").fill("An audiobook chapter that plays from Google Drive.");
  await page.getByLabel(/Google Drive link \(for long audio/).fill(DRIVE);
  await expect(page.getByTestId("drive-link-ok")).toBeVisible();
  await page.getByLabel("Minutes").fill("95");
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  await gotoReady(page, "/astrology-audios?q=Audiobook");
  const card = page.getByTestId("episode-card").filter({ visible: true }).filter({ hasText: "E2E Audiobook From Drive" });
  await expect(card.getByTestId("listen-button")).toBeVisible();
  await expect(card).toContainText("1 hr 35 min");
  await gotoReady(page, "/astrology-audios/e2e-audiobook-from-drive");
  await expect(page.getByTestId("drive-embed")).toHaveAttribute("src", "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/preview");
  await expect(page.getByRole("link", { name: "Open in Google Drive" })).toHaveAttribute("href", "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view");
});

test("book PDF post and an old video land on their menu pages", async ({ page, request }) => {
  test.setTimeout(150_000);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.0.0.31" });
  await login(page);

  // A chapter of the book in Hindi, as a PDF only.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Book Chapter One");
  await page.getByLabel("Category").selectOption({ label: "Book (Hindi)" });
  await page.getByLabel("Short description").fill("The first chapter of the book as a PDF.");
  await page.getByTestId("pdf-input").setInputFiles({ name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("<html>not a pdf</html>") });
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page.getByRole("alert").filter({ hasText: /could not be verified|do not match/ }).first()).toBeVisible();
  await page.getByTestId("pdf-input").setInputFiles({ name: "chapter-1.pdf", mimeType: "application/pdf", buffer: readFileSync("tests/fixtures/book-sample.pdf") });
  await expect(page.getByTestId("pdf-ready")).toBeVisible();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  await gotoReady(page, "/book");
  const chapter = page.getByTestId("book-pdf-hindi").getByTestId("episode-card").filter({ hasText: "E2E Book Chapter One" });
  await expect(chapter).toBeVisible();
  await expect(chapter).toContainText("PDF");
  await expect(page.getByTestId("book-audio-hindi").getByTestId("empty-state")).toBeVisible();
  await chapter.getByRole("link").first().click();
  await expect(page.getByTestId("pdf-block")).toBeVisible();
  const pdfHref = await page.getByTestId("pdf-download").getAttribute("href");
  const pdf = await request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // An Astro Cricket video marked as old moves to Old Videos.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Old Cricket Video");
  await page.getByLabel("Category").selectOption({ label: "Astro Cricket Videos" });
  await page.getByLabel("Short description").fill("An older Astro Cricket video podcast.");
  await page.getByLabel("…or YouTube / Instagram link").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByTestId("archived-checkbox").check();
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);

  await gotoReady(page, "/astro-cricket/old-videos");
  await expect(page.getByTestId("topic-posts").getByTestId("episode-card").filter({ hasText: "E2E Old Cricket Video" })).toBeVisible();
  await gotoReady(page, "/astro-cricket/videos");
  await expect(page.getByTestId("episode-card").filter({ visible: true }).filter({ hasText: "E2E Old Cricket Video" })).toHaveCount(0);

  // Testimonials › Message proof: screenshots posted as photos show on the page and open full size.
  await gotoReady(page, "/admin/episodes/new");
  await page.getByLabel("Title").fill("E2E Messages After The Final");
  await page.getByLabel("Category").selectOption({ label: "Message Proof" });
  await page.getByLabel("Short description").fill("Messages received after the final.");
  await page.getByTestId("gallery-input").setInputFiles([
    { name: "msg-1.png", mimeType: "image/png", buffer: readFileSync("tests/fixtures/reel-frame.png") },
    { name: "msg-2.jpg", mimeType: "image/jpeg", buffer: readFileSync("tests/fixtures/wide-frame.jpg") },
  ]);
  await expect(page.getByTestId("gallery-list").locator("li")).toHaveCount(2);
  await page.getByTestId("publish-checkbox").check();
  await page.getByTestId("save-episode").click();
  await expect(page).toHaveURL(/\/admin\/episodes\/[0-9a-f-]{36}/);
  await gotoReady(page, "/testimonials#messages");
  const proof = page.getByTestId("message-proof").filter({ hasText: "E2E Messages After The Final" });
  await expect(proof.locator("img")).toHaveCount(2);
  await expect(page.getByTestId("testimonials-audio").getByTestId("empty-state")).toBeVisible();
});
