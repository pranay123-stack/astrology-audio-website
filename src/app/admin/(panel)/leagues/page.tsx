import type { Metadata } from "next";
import { LeaguesManager } from "@/components/admin/LeaguesManager";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Leagues & teams" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function LeaguesPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <LeaguesContent />
    </Suspense>
  );
}

async function LeaguesContent() {
  await requireAdmin();
  const repo = await getAdminRepository();
  const [competitions, teams] = await Promise.all([repo.listCompetitions(), repo.listTeams()]);
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-4xl font-semibold">Leagues &amp; teams</h1>
        <p className="mt-2 text-sm text-muted">
          Cricket episodes pick their competition and teams from this list. Add a competition such as the IPL here and it appears in
          the episode form and the public filters.
        </p>
      </div>
      <LeaguesManager competitions={competitions} teams={teams} />
    </div>
  );
}
