import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ExternalLink, Pencil, Plus, TriangleAlert } from "lucide-react";
import { setPublished } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ConfirmButton";
import { KrishnaEditor, QuoteEditor, RulesEditor } from "@/components/admin/SiteContentEditors";
import { adminSection, type AdminSection, type AdminSlot } from "@/lib/admin-site";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { episodeStatus } from "@/lib/data/repository";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content";
import type { Competition, Team } from "@/lib/types";

export const metadata: Metadata = { title: "Website content" };

/** One item of the website menu: every place on it that lists posts, its Add buttons, and its page text. */
export default function SiteSectionPage({ params }: PageProps<"/admin/site/[section]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <SectionContent params={params} />
    </Suspense>
  );
}

async function SectionContent({ params }: Pick<PageProps<"/admin/site/[section]">, "params">) {
  await requireAdmin();
  const section = adminSection((await params).section);
  if (!section) notFound();
  const repo = await getAdminRepository();
  const [competitions, teams] = await Promise.all([repo.listCompetitions(), repo.listTeams()]);
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Website menu</p>
          <h1 className="text-4xl font-semibold">{section.title}</h1>
          <p className="mt-2 text-sm text-muted">{section.intro}</p>
        </div>
        <Link href={section.page} target="_blank" className="btn-ghost"><ExternalLink className="h-4 w-4" aria-hidden /> View page</Link>
      </div>
      {section.slots.map((slot) => <Slot key={slot.id} slot={slot} competitions={competitions} teams={teams} />)}
      {section.links?.map((l) => (
        <Link key={l.href + l.label} href={l.href} className="card group flex items-center justify-between gap-4 p-5 hover:border-gold/50">
          <span>
            <span className="block font-semibold group-hover:text-gold-soft">{l.label}</span>
            <span className="text-sm text-muted">{l.hint}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-gold-soft" aria-hidden />
        </Link>
      ))}
      <Editor section={section} />
    </div>
  );
}

/** A place on the website: what is on it now, and the button that adds to it. */
async function Slot({ slot, competitions, teams }: { slot: AdminSlot; competitions: Competition[]; teams: Team[] }) {
  const repo = await getAdminRepository();
  const { items, total } = await repo.queryEpisodes({ ...slot.query, includeUnpublished: true, limit: 50 });
  const competition = competitions.find((c) => c.slug === slot.add.competition);
  const noTeams = competition && !teams.some((t) => t.competition_id === competition.id);
  return (
    <section className="card space-y-4 p-5" data-testid={`slot-${slot.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{slot.title} <span className="text-base font-normal text-muted">({total})</span></h2>
          <p className="text-sm text-muted">{slot.hint}</p>
        </div>
        <Link href={`/admin/episodes/new?for=${slot.id}`} className="btn-gold px-4 py-2 text-sm" data-testid={`add-${slot.id}`}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Link>
      </div>
      {noTeams && (
        <p className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{competition.name} has no teams yet. <Link href="/admin/leagues" className="underline">Add its teams</Link> first, or the form has none to choose.</span>
        </p>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-line">
          {items.map((e) => {
            const state = episodeStatus(e);
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm" data-testid="slot-post">
                <Link href={`/admin/episodes/${e.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-gold-soft">{e.title}</Link>
                <span className={`chip ${state === "live" ? "bg-emerald-500/15 text-emerald-200" : e.is_published ? "bg-sky-500/15 text-sky-200" : "bg-white/10 text-muted"}`}>
                  {state === "live" ? "Live" : state === "scheduled" ? "Scheduled" : "Draft"}
                </span>
                <Link href={`/admin/episodes/${e.id}`} className="btn-ghost px-3 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                <ActionButton action={setPublished.bind(null, e.id, !e.is_published)} className="btn-ghost px-3 py-1.5 text-xs">
                  {e.is_published ? "Unpublish" : "Publish"}
                </ActionButton>
              </li>
            );
          })}
        </ul>
      )}
      {total > items.length && <Link href="/admin/episodes" className="text-sm text-gold-soft">Showing {items.length} of {total}. See all posts →</Link>}
    </section>
  );
}

async function Editor({ section }: { section: AdminSection }) {
  if (!section.editor) return null;
  const repo = await getAdminRepository();
  if (section.editor === "rules") return <RulesEditor initial={(await repo.getSiteContent("rules")) ?? SITE_CONTENT_DEFAULTS.rules} />;
  if (section.editor === "krishna") return <KrishnaEditor initial={(await repo.getSiteContent("krishna")) ?? SITE_CONTENT_DEFAULTS.krishna} />;
  return <QuoteEditor initial={(await repo.getSiteContent("quotes")) ?? SITE_CONTENT_DEFAULTS.quotes} />;
}
