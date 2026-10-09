import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
