import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { QUOTE } from "../../src/content/quote";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.com", password: process.env.E2E_ADMIN_PASSWORD ?? "e2e-Password-123" };
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

let anon: SupabaseClient;
let service: SupabaseClient;
let admin: SupabaseClient;
let member: SupabaseClient;
let memberId: string;
const cleanup: string[] = [];

async function signedIn(email: string, password: string) {
  const c = createClient(url, anonKey, opts);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

let generalCat: string;
let cricketCat: string;
let bbl: string;
let teams: { id: string; name: string; competition_id: string }[];

beforeAll(async () => {
  if (!url || !anonKey || !serviceKey) throw new Error("Supabase env vars missing");
  anon = createClient(url, anonKey, opts);
  service = createClient(url, serviceKey, opts);
  admin = await signedIn(ADMIN.email, ADMIN.password);
  const email = `member-${randomUUID()}@example.com`;
  const created = await service.auth.admin.createUser({ email, password: "member-Password-1", email_confirm: true });
  memberId = created.data.user!.id;
  member = await signedIn(email, "member-Password-1");

  const cats = (await service.from("categories").select("id,section")).data!;
  generalCat = cats.find((c) => c.section === "general")!.id;
  cricketCat = cats.find((c) => c.section === "cricket")!.id;
  bbl = (await service.from("competitions").select("id").eq("slug", "bbl").single()).data!.id;
  teams = (await service.from("teams").select("id,name,competition_id")).data!;
});

afterAll(async () => {
  if (cleanup.length) await service.from("episodes").delete().in("id", cleanup);
  await service.from("competitions").delete().eq("slug", "tmp-league");
  await service.from("contact_messages").delete().eq("email", "s@example.com");
  if (memberId) await service.auth.admin.deleteUser(memberId);
});

async function makeEpisode(over: Record<string, unknown>) {
  const { data, error } = await service
    .from("episodes")
    .insert({
      title: `RLS ${randomUUID().slice(0, 8)}`,
      slug: `rls-${randomUUID()}`,
      excerpt: "rls test episode",
      category_id: generalCat,
      audio_storage_path: "audio/00000000-0000-4000-a000-000000000000.mp3",
      ...over,
    })
    .select("id")
    .single();
  if (error) throw error;
  cleanup.push(data.id);
  return data.id as string;
}

describe("visitors (anon key)", () => {
  it("see only published episodes whose publication time has passed", async () => {
    const draft = await makeEpisode({ is_published: false });
    const scheduled = await makeEpisode({ is_published: true, published_at: new Date(Date.now() + 86_400_000).toISOString() });
    const live = await makeEpisode({ is_published: true, published_at: new Date(Date.now() - 1000).toISOString() });
    const { data } = await anon.from("episodes").select("id").in("id", [draft, scheduled, live]);
    expect(data!.map((r) => r.id)).toEqual([live]);
    const view = await anon.from("episode_listings").select("id").in("id", [draft, scheduled, live]);
    expect(view.data!.map((r) => r.id)).toEqual([live]);
  });

  it("cannot see the match row of an unpublished episode", async () => {
    const draft = await makeEpisode({ is_published: false, category_id: cricketCat });
    const bblTeams = teams.filter((t) => t.competition_id === bbl);
    await service.from("cricket_matches").insert({ episode_id: draft, competition_id: bbl, team_a_id: bblTeams[0].id, team_b_id: bblTeams[1].id, match_date: new Date().toISOString() });
    const { data } = await anon.from("cricket_matches").select("id").eq("episode_id", draft);
    expect(data).toEqual([]);
  });

  it("cannot write content", async () => {
    const ins = await anon.from("episodes").insert({ title: "hack", slug: "hack", category_id: generalCat });
    expect(ins.error).not.toBeNull();
    const upd = await anon.from("categories").update({ name: "hacked" }).neq("id", "00000000-0000-0000-0000-000000000000").select();
    expect(upd.error ?? (upd.data?.length === 0 ? null : "updated")).not.toBe("updated");
    const del = await anon.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000").select();
    expect(del.error !== null || del.data!.length === 0).toBe(true);
    expect((await service.from("teams").select("id", { count: "exact", head: true })).count).toBeGreaterThan(0);
  });

  it("cannot read or write contact messages, purchases or the admin list", async () => {
    await service.from("contact_messages").insert({ name: "Secret", email: "s@example.com", message: "private message body" });
    expect((await anon.from("contact_messages").select("*")).data).toEqual([]);
    expect((await anon.from("contact_messages").insert({ name: "Spam", email: "x@example.com", message: "spam spam spam" })).error).not.toBeNull();
    expect((await anon.from("purchases").select("*")).data ?? []).toEqual([]);
    expect((await anon.from("admins").select("*")).data ?? []).toEqual([]);
  });

  it("cannot call admin or entitlement functions", async () => {
    expect((await anon.rpc("admin_save_episode", { p_id: null, p_episode: {}, p_match: null })).error).not.toBeNull();
    expect((await anon.rpc("has_premium_access", { p_user: memberId, p_episode: randomUUID() })).error).not.toBeNull();
    expect((await anon.rpc("is_admin")).data).toBe(false);
  });

  it("can bump the play count of live episodes only", async () => {
    const live = await makeEpisode({ is_published: true, published_at: new Date(Date.now() - 1000).toISOString() });
    const draft = await makeEpisode({ is_published: false });
    await anon.rpc("increment_play_count", { p_episode: live });
    await anon.rpc("increment_play_count", { p_episode: draft });
    const rows = (await service.from("episodes").select("id,play_count").in("id", [live, draft])).data!;
    expect(rows.find((r) => r.id === live)!.play_count).toBe(1);
    expect(rows.find((r) => r.id === draft)!.play_count).toBe(0);
  });

  it("can read public images but not private audio objects", async () => {
    // Upload fixtures with the service role so this test does not depend on seeded media.
    const audioPath = `audio/${randomUUID()}.mp3`;
    const imagePath = `covers/${randomUUID()}.png`;
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    expect((await service.storage.from("audio").upload(audioPath, Buffer.from("ID3\u0004test"), { contentType: "audio/mpeg" })).error).toBeNull();
    expect((await service.storage.from("images").upload(imagePath, png, { contentType: "image/png" })).error).toBeNull();
    try {
      const publicAudio = await fetch(`${url}/storage/v1/object/public/audio/${audioPath}`);
      expect(publicAudio.ok).toBe(false);
      expect((await anon.storage.from("audio").download(audioPath)).error).not.toBeNull();
      const img = await fetch(`${url}/storage/v1/object/public/images/${imagePath}`);
      expect(img.status).toBe(200);
    } finally {
      await service.storage.from("audio").remove([audioPath]);
      await service.storage.from("images").remove([imagePath]);
    }
  });

  it("cannot upload to storage", async () => {
    const up = await anon.storage.from("audio").upload(`audio/${randomUUID()}.mp3`, new Blob(["ID3xxxx"], { type: "audio/mpeg" }));
    expect(up.error).not.toBeNull();
  });
});

describe("page text edited in Admin", () => {
  it("visitors read it; visitors and members cannot change it; an admin can", async () => {
    const { data: saved, error } = await anon.from("site_content").select("value").eq("key", "quotes").maybeSingle();
    expect(error).toBeNull();
    const value = saved?.value ?? QUOTE;
    for (const client of [anon, member]) {
      await client.from("site_content").upsert({ key: "quotes", value: { text: "tampered" } });
      const { data } = await service.from("site_content").select("value").eq("key", "quotes").maybeSingle();
      expect(data?.value ?? null).toEqual(saved?.value ?? null);
    }
    // Writes back what is already shown, so the live site never changes during this test.
    expect((await admin.from("site_content").upsert({ key: "quotes", value })).error).toBeNull();
    if (!saved) await service.from("site_content").delete().eq("key", "quotes");
  });
});

describe("articles", () => {
  async function postWithArticle(over: Record<string, unknown>, body: string) {
    const id = await makeEpisode({ audio_storage_path: null, has_article: true, ...over });
    const { error } = await service.from("episode_articles").insert({ episode_id: id, body });
    if (error) throw error;
    return id;
  }
  const live = { is_published: true, published_at: new Date(Date.now() - 1000).toISOString() };

  it("visitors read articles of live free posts only", async () => {
    const free = await postWithArticle(live, "शनि पर मुफ़्त लेख");
    const premium = await postWithArticle({ ...live, is_premium: true }, "गुप्तप्रीमियमज़्ज़लेख");
    const draft = await postWithArticle({ is_published: false }, "ड्राफ़्ट लेख");
    const direct = await anon.from("episode_articles").select("episode_id, body").in("episode_id", [free, premium, draft]);
    expect(direct.data).toEqual([{ episode_id: free, body: "शनि पर मुफ़्त लेख" }]);
    // Through the listing view the premium post is visible, but its article body is empty.
    const view = await anon.from("episode_listings").select("id, has_article, article").in("id", [free, premium]);
    const byId = Object.fromEntries((view.data ?? []).map((r) => [r.id, r]));
    expect(byId[free]).toMatchObject({ has_article: true, article: "शनि पर मुफ़्त लेख" });
    expect(byId[premium]).toMatchObject({ has_article: true, article: "" });
    // Premium text cannot be found by searching either.
    expect((await anon.from("episode_listings").select("id").ilike("search_text", "%गुप्तप्रीमियमज़्ज़%")).data).toEqual([]);
    // Admins see everything.
    expect((await admin.from("episode_articles").select("episode_id").in("episode_id", [free, premium, draft])).data).toHaveLength(3);
  });

  it("premium translations stay hidden from visitors, free ones are public", async () => {
    const premium = await makeEpisode({ ...live, audio_storage_path: null, has_article_alt: true, title_alt: "Secret", is_premium: true });
    const free = await makeEpisode({ ...live, audio_storage_path: null, has_article_alt: true, title_alt: "Open" });
    for (const [id, alt] of [[premium, "SecretEnglishBody"], [free, "OpenEnglishBody"]]) {
      const { error } = await service.from("episode_articles").insert({ episode_id: id, body: "", body_alt: alt });
      if (error) throw error;
    }
    const view = await anon.from("episode_listings").select("id, article_alt, has_article_alt, category_name_hi").in("id", [free, premium]);
    const byId = Object.fromEntries((view.data ?? []).map((r) => [r.id, r]));
    expect(byId[free]).toMatchObject({ has_article_alt: true, article_alt: "OpenEnglishBody" });
    expect(byId[premium]).toMatchObject({ has_article_alt: true, article_alt: "" });
    expect((await anon.from("episode_articles").select("body_alt").eq("episode_id", premium)).data).toEqual([]);
    expect((await anon.from("episode_listings").select("id").ilike("search_text", "%secretenglishbody%")).data).toEqual([]);
    expect((await anon.from("episode_listings").select("id").ilike("search_text", "%openenglishbody%")).data).toEqual([{ id: free }]);
  });

  it("visitors and members cannot write articles", async () => {
    const id = await makeEpisode({ is_published: false });
    expect((await anon.from("episode_articles").insert({ episode_id: id, body: "spam" })).error).not.toBeNull();
    expect((await member.from("episode_articles").insert({ episode_id: id, body: "spam" })).error).not.toBeNull();
  });

  it("a post can be published with an article and no audio, but not with neither", async () => {
    expect((await service.from("episodes").insert({ title: "Lekh", slug: `lekh-${randomUUID().slice(0, 8)}`, category_id: generalCat, has_article: true, ...live }).select("id").single()).error).toBeNull();
    const bad = await service.from("episodes").insert({ title: "Empty", slug: `empty-${randomUUID().slice(0, 8)}`, category_id: generalCat, ...live });
    expect(bad.error?.code).toBe("23514");
    await service.from("episodes").delete().like("slug", "lekh-%");
  });

  it("admin_save_episode stores, updates and removes the article atomically", async () => {
    const episode = {
      title: "Shani article", slug: `shani-${randomUUID().slice(0, 8)}`, excerpt: "article test", description: "", category_id: generalCat,
      audio_storage_path: null, audio_mime_type: null, cover_image_path: null, duration_seconds: 0, is_published: true, is_premium: false,
      published_at: new Date().toISOString(), article: "## शनि\n\nलेख", article_lang: "hi",
    };
    const { data: id, error } = await admin.rpc("admin_save_episode", { p_id: null, p_episode: episode, p_match: null });
    expect(error).toBeNull();
    cleanup.push(id);
    expect((await admin.from("episodes").select("has_article, article_lang").eq("id", id).single()).data).toEqual({ has_article: true, article_lang: "hi" });
    expect((await admin.from("episode_articles").select("body").eq("episode_id", id).single()).data?.body).toBe("## शनि\n\nलेख");
    // Removing the article while it is the only content must fail (nothing left to publish).
    const empty = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...episode, article: "" }, p_match: null });
    expect(empty.error).not.toBeNull();
    // As a draft it is allowed, and the article row is deleted.
    const asDraft = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...episode, article: "", is_published: false }, p_match: null });
    expect(asDraft.error).toBeNull();
    expect((await admin.from("episode_articles").select("episode_id").eq("episode_id", id)).data).toEqual([]);
    // A translation alone is enough to publish, and both bodies are stored.
    const translated = { ...episode, article: "", title_alt: "Saturn", excerpt_alt: "English summary", article_alt: "## Saturn\n\nEnglish" };
    expect((await admin.rpc("admin_save_episode", { p_id: id, p_episode: translated, p_match: null })).error).toBeNull();
    expect((await admin.from("episodes").select("has_article, has_article_alt, title_alt, excerpt_alt").eq("id", id).single()).data).toEqual({
      has_article: false, has_article_alt: true, title_alt: "Saturn", excerpt_alt: "English summary",
    });
    expect((await admin.from("episode_articles").select("body, body_alt").eq("episode_id", id).single()).data).toEqual({ body: "", body_alt: "## Saturn\n\nEnglish" });
  });
});

describe("video and photos", () => {
  it("the video bucket is private and visitors cannot upload to it", async () => {
    const videoPath = `video/${randomUUID()}.webm`;
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]);
    expect((await service.storage.from("video").upload(videoPath, webm, { contentType: "video/webm" })).error).toBeNull();
    try {
      expect((await fetch(`${url}/storage/v1/object/public/video/${videoPath}`)).ok).toBe(false);
      expect((await anon.storage.from("video").download(videoPath)).error).not.toBeNull();
    } finally {
      await service.storage.from("video").remove([videoPath]);
    }
    const up = await anon.storage.from("video").upload(`video/${randomUUID()}.mp4`, new Blob(["xxxx"], { type: "video/mp4" }));
    expect(up.error).not.toBeNull();
    // Other types are refused by the bucket itself.
    const wrong = await service.storage.from("video").upload(`video/${randomUUID()}.mp3`, Buffer.from("ID3xxxx"), { contentType: "audio/mpeg" });
    expect(wrong.error).not.toBeNull();
  });

  it("admin_save_episode stores the video, link and gallery; photos alone are enough to publish", async () => {
    const g1 = `gallery/${randomUUID()}.jpg`;
    const g2 = `gallery/${randomUUID()}.png`;
    const episode = {
      title: "Reel test", slug: `reel-${randomUUID().slice(0, 8)}`, excerpt: "video test", description: "", category_id: generalCat,
      audio_storage_path: null, audio_mime_type: null, cover_image_path: null, duration_seconds: 0, is_published: true, is_premium: false,
      published_at: new Date().toISOString(), article: "", article_lang: "hi",
      video_storage_path: `video/${randomUUID()}.mp4`, video_mime_type: "video/mp4", video_format: "reel",
      video_link: "https://youtu.be/dQw4w9WgXcQ", gallery_paths: [g2, g1],
    };
    const { data: id, error } = await admin.rpc("admin_save_episode", { p_id: null, p_episode: episode, p_match: null });
    expect(error).toBeNull();
    cleanup.push(id);
    const cols = "video_format, video_link, video_mime_type, gallery_paths";
    expect((await anon.from("episode_listings").select(cols).eq("id", id).single()).data).toEqual({
      video_format: "reel", video_link: "https://youtu.be/dQw4w9WgXcQ", video_mime_type: "video/mp4", gallery_paths: [g2, g1],
    });
    // A Google Drive audio link alone is publishable too.
    const driveOnly = { ...episode, video_storage_path: null, video_mime_type: null, video_link: "", gallery_paths: [], audio_link: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view" };
    expect((await admin.rpc("admin_save_episode", { p_id: id, p_episode: driveOnly, p_match: null })).error).toBeNull();
    expect((await anon.from("episode_listings").select("audio_link").eq("id", id).single()).data?.audio_link).toBe(driveOnly.audio_link);
    // Only the photos left: still publishable.
    const photosOnly = { ...episode, video_storage_path: null, video_mime_type: null, video_link: "", gallery_paths: [g1] };
    expect((await admin.rpc("admin_save_episode", { p_id: id, p_episode: photosOnly, p_match: null })).error).toBeNull();
    // Nothing at all: refused while published.
    const nothing = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...photosOnly, gallery_paths: [] }, p_match: null });
    expect(nothing.error).not.toBeNull();
    // An unknown video format is refused by the table.
    const bad = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...photosOnly, video_format: "story" }, p_match: null });
    expect(bad.error).not.toBeNull();
  });
});

describe("book PDFs and old videos", () => {
  it("the documents bucket is public to read, takes only PDFs, and visitors cannot upload", async () => {
    const pdfPath = `documents/${randomUUID()}.pdf`;
    const pdf = Buffer.from("%PDF-1.4\n%\xe2\xe3\n1 0 obj << >> endobj\n%%EOF\n");
    expect((await service.storage.from("documents").upload(pdfPath, pdf, { contentType: "application/pdf" })).error).toBeNull();
    try {
      const res = await fetch(`${url}/storage/v1/object/public/documents/${pdfPath}`);
      expect(res.ok).toBe(true);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    } finally {
      await service.storage.from("documents").remove([pdfPath]);
    }
    expect((await anon.storage.from("documents").upload(`documents/${randomUUID()}.pdf`, new Blob(["%PDF-1.4"], { type: "application/pdf" }))).error).not.toBeNull();
    const wrong = await service.storage.from("documents").upload(`documents/${randomUUID()}.html`, Buffer.from("<html>"), { contentType: "text/html" });
    expect(wrong.error).not.toBeNull();
  });

  it("admin_save_episode stores a PDF and the old-video mark; a PDF alone is enough to publish", async () => {
    const { data: cats } = await admin.from("categories").select("id, slug").in("slug", ["book-hindi", "cricket-podcast", "kp-research", "player-horoscopes", "book-english"]);
    expect(cats!.map((c) => c.slug).sort()).toEqual(["book-english", "book-hindi", "cricket-podcast", "kp-research", "player-horoscopes"]);
    const book = cats!.find((c) => c.slug === "book-hindi")!.id;
    const episode = {
      title: "PDF test", slug: `pdf-${randomUUID().slice(0, 8)}`, excerpt: "pdf test post", description: "", category_id: book,
      audio_storage_path: null, audio_mime_type: null, cover_image_path: null, duration_seconds: 0, is_published: true, is_premium: false,
      published_at: new Date().toISOString(), article: "", article_lang: "hi", gallery_paths: [],
      pdf_storage_path: `documents/${randomUUID()}.pdf`, is_archived: true,
    };
    const { data: id, error } = await admin.rpc("admin_save_episode", { p_id: null, p_episode: episode, p_match: null });
    expect(error).toBeNull();
    cleanup.push(id);
    expect((await anon.from("episode_listings").select("pdf_storage_path, pdf_link, is_archived, category_slug").eq("id", id).single()).data).toEqual({
      pdf_storage_path: episode.pdf_storage_path, pdf_link: "", is_archived: true, category_slug: "book-hindi",
    });
    const driveOnly = { ...episode, pdf_storage_path: null, pdf_link: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view", is_archived: false };
    expect((await admin.rpc("admin_save_episode", { p_id: id, p_episode: driveOnly, p_match: null })).error).toBeNull();
    expect((await anon.from("episode_listings").select("pdf_link, is_archived").eq("id", id).single()).data).toEqual({ pdf_link: driveOnly.pdf_link, is_archived: false });
    const nothing = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...driveOnly, pdf_link: "" }, p_match: null });
    expect(nothing.error).not.toBeNull();
    const { data: comps } = await anon.from("competitions").select("slug").in("slug", ["bbl", "ipl", "t20i"]);
    expect(comps!.map((c) => c.slug).sort()).toEqual(["bbl", "ipl", "t20i"]);
  });
});

describe("renamed posts", () => {
  it("remembers the old slug for redirects; visitors can read it but never write it", async () => {
    const slug = `rename-${randomUUID().slice(0, 8)}`;
    const { data, error } = await service
      .from("episodes")
      .insert({ title: "Rename test", slug, category_id: generalCat, has_article: false, is_published: false })
      .select("id")
      .single();
    expect(error).toBeNull();
    cleanup.push(data!.id);
    expect((await service.from("episodes").update({ slug: `${slug}-new` }).eq("id", data!.id)).error).toBeNull();
    const row = await anon.from("episode_slug_redirects").select("old_slug, episode_id").eq("old_slug", slug).single();
    expect(row.data).toEqual({ old_slug: slug, episode_id: data!.id });
    expect((await anon.from("episode_slug_redirects").insert({ old_slug: `x-${slug}`, episode_id: data!.id })).error).not.toBeNull();
    expect((await member.from("episode_slug_redirects").delete().eq("old_slug", slug).select()).data ?? []).toEqual([]);
  });
});

describe("signed-in non-admin user", () => {
  it("is not an admin and cannot write content or read messages", async () => {
    expect((await member.rpc("is_admin")).data).toBe(false);
    expect((await member.from("episodes").insert({ title: "nope", slug: `nope-${randomUUID()}`, category_id: generalCat })).error).not.toBeNull();
    expect((await member.from("contact_messages").select("*")).data).toEqual([]);
    expect((await member.rpc("admin_save_episode", { p_id: null, p_episode: { category_id: generalCat }, p_match: null })).error?.message).toMatch(/Not authorised/);
  });

  it("sees only their own purchases", async () => {
    await service.from("purchases").insert({ user_id: memberId, kind: "subscription", status: "paid", provider: "test", provider_reference: randomUUID(), amount_cents: 100, currency: "AUD" });
    const mine = await member.from("purchases").select("user_id");
    expect(mine.data!.every((p) => p.user_id === memberId)).toBe(true);
    expect(mine.data!.length).toBe(1);
    expect((await service.rpc("has_premium_access", { p_user: memberId, p_episode: randomUUID() })).data).toBe(true);
  });
});

describe("saved KP charts", () => {
  const birth = { date: "1994-07-24", time: "11:43:00", place: "Test", lat: 25.96, lon: 85.27, zone: "Asia/Kolkata" };

  it("each signed-in user sees and changes only their own charts", async () => {
    const mine = await member.from("kp_charts").insert({ name: "rls mine", birth }).select("id, user_id").single();
    expect(mine.error).toBeNull();
    expect(mine.data!.user_id).toBe(memberId);
    const other = await admin.from("kp_charts").insert({ name: "rls admin", birth }).select("id").single();
    expect(other.error).toBeNull();

    // The member sees only their own row, and cannot read, change or delete the other one.
    const seen = await member.from("kp_charts").select("id, name");
    expect(seen.data!.map((r) => r.name)).toEqual(["rls mine"]);
    expect((await member.from("kp_charts").update({ notes: "hijack" }).eq("id", other.data!.id).select("id")).data).toEqual([]);
    expect((await member.from("kp_charts").delete().eq("id", other.data!.id).select("id")).data).toEqual([]);
    expect((await admin.from("kp_charts").select("notes").eq("id", other.data!.id).single()).data?.notes).toBe("");
    // Nor can they file a chart under someone else's account.
    const adminId = (await admin.auth.getUser()).data.user!.id;
    expect((await member.from("kp_charts").insert({ name: "spoof", birth, user_id: adminId })).error).not.toBeNull();

    // Notes can be saved on their own chart.
    expect((await member.from("kp_charts").update({ notes: "my notes" }).eq("id", mine.data!.id)).error).toBeNull();

    await service.from("kp_charts").delete().in("id", [mine.data!.id, other.data!.id]);
  });

  it("the table itself stays closed to visitors without an account", async () => {
    expect((await anon.from("kp_charts").insert({ name: "anon", birth })).error).not.toBeNull();
    const read = await anon.from("kp_charts").select("id");
    expect(read.data ?? []).toEqual([]);
  });

  it("anyone saves a chart without signing in, and anyone opens and lists it; only its maker sees the notes and changes it", async () => {
    const key = "a".repeat(40);
    const made = await anon.rpc("kp_chart_create", { p_name: "rls public", p_birth: birth, p_key: key });
    expect(made.error).toBeNull();
    const id = made.data as string;
    type Row = { name: string; notes: string; is_owner: boolean; birth: typeof birth };
    const get = async (c: typeof anon, k?: string) => ((await c.rpc("kp_chart_get", { p_id: id, p_key: k ?? null })).data ?? []) as Row[];

    // A key that is too short is refused.
    expect((await anon.rpc("kp_chart_create", { p_name: "x", p_birth: birth, p_key: "short" })).error).not.toBeNull();

    // The maker (by key) changes it; a wrong key, another browser or another account cannot.
    expect((await anon.rpc("kp_chart_set_notes", { p_id: id, p_key: key, p_notes: "maker notes" })).data).toBe(true);
    expect((await anon.rpc("kp_chart_set_notes", { p_id: id, p_key: "b".repeat(40), p_notes: "hijack" })).data).toBe(false);
    expect((await anon.rpc("kp_chart_edit", { p_id: id, p_key: null, p_name: "hijack", p_birth: birth })).data).toBe(false);
    expect((await member.rpc("kp_chart_edit", { p_id: id, p_key: null, p_name: "hijack", p_birth: birth })).data).toBe(false);
    expect((await member.rpc("kp_chart_delete", { p_id: id, p_key: null })).data).toBe(false);

    // Everyone opens it; the notes only with the key.
    expect((await get(anon, key)).map((r) => [r.name, r.notes, r.is_owner])).toEqual([["rls public", "maker notes", true]]);
    expect((await get(anon)).map((r) => [r.name, r.notes, r.is_owner])).toEqual([["rls public", "", false]]);
    expect((await get(member)).map((r) => [r.notes, r.is_owner])).toEqual([["", false]]);
    // The administrator may change any chart (and sees its notes).
    expect((await get(admin)).map((r) => [r.notes, r.is_owner])).toEqual([["maker notes", true]]);

    // Listed for everyone, without the notes, and searchable by name or place.
    const listed = (await anon.rpc("kp_chart_list", { p_q: "rls public" })).data as Record<string, unknown>[];
    expect(listed.map((r) => r.id)).toEqual([id]);
    expect(Object.keys(listed[0])).not.toContain("notes");
    expect(((await anon.rpc("kp_chart_list", { p_q: "Test" })).data as { id: string }[]).map((r) => r.id)).toContain(id);

    // Editing in place keeps the id (and so the link) and the notes.
    expect((await anon.rpc("kp_chart_edit", { p_id: id, p_key: key, p_name: "rls public 2", p_birth: { ...birth, time: "19:39:47" } })).data).toBe(true);
    expect((await get(anon, key)).map((r) => [r.name, r.birth.time, r.notes])).toEqual([["rls public 2", "19:39:47", "maker notes"]]);

    // The key is never readable, and the helper that checks it cannot be called directly.
    expect((await anon.rpc("kp_chart_can_edit", { p_user: null, p_edit_key: null, p_key: key })).error).not.toBeNull();

    expect((await anon.rpc("kp_chart_delete", { p_id: id, p_key: key })).data).toBe(true);
    expect(await get(anon)).toEqual([]);
  });

  it("a signed-in visitor's chart is theirs by account, on any device", async () => {
    const made = await member.rpc("kp_chart_create", { p_name: "rls member", p_birth: birth, p_key: "c".repeat(40) });
    expect(made.error).toBeNull();
    const id = made.data as string;
    // On their dashboard (own rows), editable without the key, and closed to other accounts.
    expect(((await member.from("kp_charts").select("id, user_id").eq("id", id).single()).data?.user_id)).toBe(memberId);
    expect((await member.rpc("kp_chart_set_notes", { p_id: id, p_key: null, p_notes: "member notes" })).data).toBe(true);
    expect((await anon.rpc("kp_chart_set_notes", { p_id: id, p_key: null, p_notes: "hijack" })).data).toBe(false);
    const seen = (await anon.rpc("kp_chart_get", { p_id: id })).data as { notes: string; is_owner: boolean }[];
    expect(seen.map((r) => [r.notes, r.is_owner])).toEqual([["", false]]);
    expect((await member.rpc("kp_chart_delete", { p_id: id, p_key: null })).data).toBe(true);
  });

  it("counts the owner's views and keeps pins, without changing the edited date", async () => {
    const mine = await member.from("kp_charts").insert({ name: "rls dash", birth }).select("id, updated_at").single();
    expect(mine.error).toBeNull();
    const id = mine.data!.id;
    const row = async () => (await member.from("kp_charts").select("view_count, last_viewed_at, pinned, updated_at").eq("id", id).single()).data!;

    expect((await member.rpc("kp_chart_viewed", { p_id: id })).error).toBeNull();
    await member.rpc("kp_chart_viewed", { p_id: id });
    expect((await member.from("kp_charts").update({ pinned: true }).eq("id", id)).error).toBeNull();
    const after = await row();
    expect([after.view_count, after.pinned, after.last_viewed_at !== null]).toEqual([2, true, true]);
    expect(after.updated_at).toBe(mine.data!.updated_at);

    // Nobody else's views are counted on it; an anonymous visitor cannot call it at all.
    expect((await admin.rpc("kp_chart_viewed", { p_id: id })).error).toBeNull();
    expect((await row()).view_count).toBe(2);
    expect((await anon.rpc("kp_chart_viewed", { p_id: id })).error).not.toBeNull();

    // A real edit does move the edited date.
    await member.from("kp_charts").update({ name: "rls dash 2" }).eq("id", id);
    expect((await row()).updated_at).not.toBe(mine.data!.updated_at);
    await service.from("kp_charts").delete().eq("id", id);
  });

  it("rejects oversized birth data and notes", async () => {
    expect((await member.from("kp_charts").insert({ name: "big", birth: { junk: "x".repeat(5000) } })).error).not.toBeNull();
    expect((await member.from("kp_charts").insert({ name: "notes", birth, notes: "x".repeat(20001) })).error).not.toBeNull();
    expect((await member.from("kp_charts").insert({ name: "array", birth: [1, 2] })).error).not.toBeNull();
  });
});

describe("administrator", () => {
  it("is recognised and can read drafts", async () => {
    expect((await admin.rpc("is_admin")).data).toBe(true);
    const draft = await makeEpisode({ is_published: false });
    expect((await admin.from("episodes").select("id").eq("id", draft)).data).toHaveLength(1);
  });

  it("saves an episode and its match atomically", async () => {
    const bblTeams = teams.filter((t) => t.competition_id === bbl);
    const slug = `rls-cricket-${randomUUID().slice(0, 8)}`;
    const episode = {
      title: "RLS cricket", slug, excerpt: "rls cricket", description: "", category_id: cricketCat,
      audio_storage_path: "audio/00000000-0000-4000-a000-000000000000.mp3", audio_mime_type: "audio/mpeg",
      cover_image_path: null, duration_seconds: 60, is_published: true, is_premium: false, published_at: new Date().toISOString(),
    };
    const { data: id, error } = await admin.rpc("admin_save_episode", {
      p_id: null,
      p_episode: episode,
      p_match: { competition_id: bbl, team_a_id: bblTeams[0].id, team_b_id: bblTeams[1].id, match_date: new Date().toISOString(), venue: "", match_status: "scheduled" },
    });
    expect(error).toBeNull();
    cleanup.push(id);
    expect((await admin.from("cricket_matches").select("id").eq("episode_id", id)).data).toHaveLength(1);

    // A team from another competition makes the whole save fail, leaving no half-written episode.
    const { data: other } = await service.from("competitions").insert({ name: "Temp League", short_name: "TMP", slug: "tmp-league" }).select("id").single();
    const { data: foreign } = await service.from("teams").insert({ competition_id: other!.id, name: "Foreign XI", short_name: "FXI" }).select("id").single();
    const slug2 = `rls-bad-${randomUUID().slice(0, 8)}`;
    const bad = await admin.rpc("admin_save_episode", {
      p_id: null,
      p_episode: { ...episode, slug: slug2 },
      p_match: { competition_id: bbl, team_a_id: bblTeams[0].id, team_b_id: foreign!.id, match_date: new Date().toISOString() },
    });
    expect(bad.error?.message).toMatch(/same|competition/i);
    expect((await service.from("episodes").select("id").eq("slug", slug2)).data).toEqual([]);
    await service.from("teams").delete().eq("id", foreign!.id);

    // Moving the episode to a general category removes its match row.
    const moved = await admin.rpc("admin_save_episode", { p_id: id, p_episode: { ...episode, category_id: generalCat }, p_match: null });
    expect(moved.error).toBeNull();
    expect((await admin.from("cricket_matches").select("id").eq("episode_id", id)).data).toEqual([]);
  });

  it("cannot publish an episode without audio (database constraint)", async () => {
    const res = await admin.from("episodes").insert({ title: "No audio", slug: `no-audio-${randomUUID().slice(0, 8)}`, category_id: generalCat, is_published: true, published_at: new Date().toISOString() });
    expect(res.error?.code).toBe("23514");
  });
});
