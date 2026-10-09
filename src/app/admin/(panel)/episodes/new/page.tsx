import type { Metadata } from "next";
import { EpisodeForm } from "@/components/admin/EpisodeForm";
import { requireAdmin } from "@/lib/auth/admin";
import { siteConfig } from "@/lib/config";
import { getAdminRepository } from "@/lib/data";
import { Suspense } from "react";

export const metadata: Metadata = { title: "New episode" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function NewEpisodePage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <NewEpisodeContent />
    </Suspense>
  );
}

async function NewEpisodeContent() {
  await requireAdmin();
  const repo = await getAdminRepository();
  const [categories, competitions, teams] = await Promise.all([repo.listCategories(), repo.listCompetitions(), repo.listTeams()]);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-4xl font-semibold">New episode</h1>
      <EpisodeForm episode={null} categories={categories} competitions={competitions} teams={teams} timeZone={siteConfig.timeZone} />
    </div>
  );
}
