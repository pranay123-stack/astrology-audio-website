import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EpisodeForm } from "@/components/admin/EpisodeForm";
import { requireAdmin } from "@/lib/auth/admin";
import { siteConfig } from "@/lib/config";
import { getAdminRepository } from "@/lib/data";
import { isLive } from "@/lib/data/repository";
import { episodeHref } from "@/lib/episodes";

export const metadata: Metadata = { title: "Edit episode" };

export default function EditEpisodePage({ params }: PageProps<"/admin/episodes/[id]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/episodes/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const repo = await getAdminRepository();
  const [episode, categories, competitions, teams] = await Promise.all([
    repo.getEpisodeById(id, { includeUnpublished: true }),
    repo.listCategories(),
    repo.listCompetitions(),
    repo.listTeams(),
  ]);
  if (!episode) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold">Edit episode</h1>
        {isLive(episode) && (
          <Link href={episodeHref(episode)} target="_blank" className="btn-ghost">View on site</Link>
        )}
      </div>
      {episode.is_demo && (
        <p className="rounded-xl border border-sky-300/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          This is a sample episode created by the seed script.
        </p>
      )}
      <EpisodeForm key={episode.updated_at} episode={episode} categories={categories} competitions={competitions} teams={teams} timeZone={siteConfig.timeZone} />
    </div>
  );
}
