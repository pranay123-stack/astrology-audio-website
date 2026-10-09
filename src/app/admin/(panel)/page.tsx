import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, FlaskConical, Inbox, Plus } from "lucide-react";
import { deleteDemoContent } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { launchChecks } from "@/lib/launch-checks";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Dashboard" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await requireAdmin();
  const repo = await getAdminRepository();
  const [stats, recent, profile] = await Promise.all([
    repo.stats(),
    repo.queryEpisodes({ includeUnpublished: true, sort: "latest", limit: 6 }),
    repo.getProfile(),
  ]);
  const checks = launchChecks(profile, stats);
  const remaining = checks.filter((c) => !c.done).length;
  const tiles = [
    { label: "Total episodes", value: stats.total },
    { label: "Live", value: stats.published },
    { label: "Drafts", value: stats.drafts },
    { label: "Scheduled", value: stats.scheduled },
    { label: "Premium", value: stats.premium },
    { label: "Unread messages", value: stats.unreadMessages },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold">Dashboard</h1>
        <Link href="/admin/episodes/new" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> New episode</Link>
      </div>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6" data-testid="stats">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <dt className="text-xs text-muted">{t.label}</dt>
            <dd className="mt-1 font-display text-4xl font-semibold text-gold-soft">{t.value}</dd>
          </div>
        ))}
      </dl>

      {remaining > 0 && (
        <section className="card p-6" data-testid="launch-checklist">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold">Before you launch</h2>
            <span className="text-sm text-muted">{checks.length - remaining} of {checks.length} done</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 text-sm">
                {c.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" aria-label="To do" />
                )}
                <span>
                  {c.href && !c.done ? (
                    <Link href={c.href} className="font-medium hover:text-gold-soft">{c.label}</Link>
                  ) : (
                    <span className={c.done ? "text-muted line-through" : "font-medium"}>{c.label}</span>
                  )}
                  {!c.done && <span className="block text-xs text-muted">{c.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.demo > 0 && (
        <div className="card flex flex-col gap-4 border-sky-300/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden />
            <p className="text-sm">
              <strong>{stats.demo} sample episodes</strong> are published so you can see how the site looks. Remove them once your own
              episodes are ready. This also removes the “Demo Team” entries.
            </p>
          </div>
          <ActionButton
            action={deleteDemoContent}
            confirmMessage="Delete all sample episodes and their media? This cannot be undone."
            className="btn-danger shrink-0"
            testId="remove-demo"
          >
            Remove sample content
          </ActionButton>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-2xl font-semibold">Episodes by category</h2>
          <ul className="divide-y divide-line">
            {stats.byCategory.map(({ category, count }) => (
              <li key={category.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {category.name} <span className="text-xs text-muted">· {category.section === "cricket" ? "Cricket" : "General"}</span>
                </span>
                <span className="font-semibold tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recently updated</h2>
            <Link href="/admin/episodes" className="text-sm text-gold-soft">All episodes →</Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.items.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/admin/episodes/${e.id}`} className="truncate hover:text-gold-soft">{e.title}</Link>
                <span className="shrink-0 text-xs text-muted">{e.is_published ? formatDate(e.published_at) : "Draft"}</span>
              </li>
            ))}
            {recent.items.length === 0 && <li className="py-2 text-sm text-muted">No episodes yet.</li>}
          </ul>
          {stats.unreadMessages > 0 && (
            <Link href="/admin/messages" className="mt-4 inline-flex items-center gap-2 text-sm text-gold-soft">
              <Inbox className="h-4 w-4" aria-hidden /> {stats.unreadMessages} unread message{stats.unreadMessages === 1 ? "" : "s"}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
