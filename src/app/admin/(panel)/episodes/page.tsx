import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { deleteEpisode, setPublished } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { episodeStatus } from "@/lib/data/repository";
import { formatDate, formatDurationLabel } from "@/lib/dates";
import { episodeHref } from "@/lib/episodes";

export const metadata: Metadata = { title: "Episodes" };

export default function EpisodesPage({ searchParams }: PageProps<"/admin/episodes">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold">Episodes</h1>
        <Link href="/admin/episodes/new" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> New episode</Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" />}>
        <EpisodeTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EpisodeTable({ searchParams }: Pick<PageProps<"/admin/episodes">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const section = sp.section === "cricket" || sp.section === "general" ? sp.section : undefined;
  const status = typeof sp.status === "string" ? sp.status : "";
  const repo = await getAdminRepository();
  const { items } = await repo.queryEpisodes({ includeUnpublished: true, search: q || undefined, section, sort: "latest" });
  const rows = items.filter((e) => !status || episodeStatus(e) === status);

  return (
    <>
      <Form action="/admin/episodes" className="card grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Search episodes" aria-label="Search episodes" className="input" />
        <select name="section" defaultValue={section ?? ""} aria-label="Section" className="input">
          <option value="">All sections</option>
          <option value="cricket">Cricket astrology</option>
          <option value="general">General astrology</option>
        </select>
        <select name="status" defaultValue={status} aria-label="Status" className="input">
          <option value="">Any status</option>
          <option value="live">Live</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
        </select>
        <button type="submit" className="btn-ghost">Filter</button>
      </Form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm" data-testid="episodes-table">
          <thead className="border-b border-line text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Title</th>
              <th scope="col" className="px-4 py-3 font-semibold">Category</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Published</th>
              <th scope="col" className="px-4 py-3 font-semibold">Length</th>
              <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((e) => {
              const state = episodeStatus(e);
              const live = state === "live";
              return (
                <tr key={e.id} data-testid="episode-row">
                  <td className="max-w-xs px-4 py-3">
                    <Link href={`/admin/episodes/${e.id}`} className="font-medium hover:text-gold-soft">{e.title}</Link>
                    <div className="mt-0.5 flex gap-2 text-xs text-muted">
                      {e.is_premium && <span>Premium</span>}
                      {e.is_demo && <span className="text-sky-200">Sample</span>}
                      {e.audio_storage_path && <span>Audio</span>}
                      {e.has_article && <span>Article</span>}
                      {!e.audio_storage_path && !e.has_article && <span className="text-red-300">No audio or article</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{e.category.name}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${live ? "bg-emerald-500/15 text-emerald-200" : e.is_published ? "bg-sky-500/15 text-sky-200" : "bg-white/10 text-muted"}`}>
                      {state === "live" ? "Live" : state === "scheduled" ? "Scheduled" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(e.published_at) || "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDurationLabel(e.duration_seconds)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {live && (
                        <Link href={episodeHref(e)} target="_blank" className="btn-ghost px-3 py-1.5 text-xs">View</Link>
                      )}
                      <Link href={`/admin/episodes/${e.id}`} className="btn-ghost px-3 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                      <ActionButton action={setPublished.bind(null, e.id, !e.is_published)} className="btn-ghost px-3 py-1.5 text-xs" testId="toggle-publish">
                        {e.is_published ? "Unpublish" : "Publish"}
                      </ActionButton>
                      <ActionButton
                        action={deleteEpisode.bind(null, e.id)}
                        confirmMessage={`Delete “${e.title}” and its audio? This cannot be undone.`}
                        className="btn-danger px-3 py-1.5 text-xs"
                        testId="delete-episode"
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No episodes found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
