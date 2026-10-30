import type { Metadata } from "next";
import { EpisodeForm } from "@/components/admin/EpisodeForm";
import { requireAdmin } from "@/lib/auth/admin";
import { siteConfig } from "@/lib/config";
import { getAdminRepository } from "@/lib/data";
import { Suspense } from "react";
import { adminSlot } from "@/lib/admin-site";

export const metadata: Metadata = { title: "New post" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function NewEpisodePage({ searchParams }: PageProps<"/admin/episodes/new">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <NewEpisodeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewEpisodeContent({ searchParams }: Pick<PageProps<"/admin/episodes/new">, "searchParams">) {
  await requireAdmin();
  const { for: place } = await searchParams;
  const slot = typeof place === "string" ? adminSlot(place) : undefined;
  const repo = await getAdminRepository();
  const [categories, competitions, teams] = await Promise.all([repo.listCategories(), repo.listCompetitions(), repo.listTeams()]);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-4xl font-semibold">{slot ? `Add to ${slot.title}` : "New post"}</h1>
      <EpisodeForm episode={null} categories={categories} competitions={competitions} teams={teams} timeZone={siteConfig.timeZone} slot={slot && { ...slot, section: { key: slot.section.key, title: slot.section.title } }} />
    </div>
  );
}
