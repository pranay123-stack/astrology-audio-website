import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Trophy } from "lucide-react";
import { LoadMore } from "@/components/episodes/LoadMore";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { MatchCard } from "@/components/episodes/MatchCard";
import { Starfield } from "@/components/layout/Starfield";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState } from "@/components/ui/SectionHeading";
import { PAGE_SIZE, parseListParams, toQueryString, type ListParams } from "@/lib/list-params";
import { getCompetitions, getEpisodes } from "@/lib/queries";
import type { EpisodeQuery } from "@/lib/types";

export const metadata: Metadata = {
  title: "Cricket Astrology — Big Bash League Match Readings",
  description:
    "Astrology audio readings for Big Bash League matches. Search by team, filter by date and listen to upcoming and past match readings.",
  alternates: { canonical: "/cricket-astrology" },
  openGraph: { title: "Cricket Astrology — Big Bash League Match Readings", url: "/cricket-astrology" },
};

const TABS: { value: ListParams["when"]; label: string }[] = [
  { value: "upcoming", label: "Upcoming matches" },
  { value: "past", label: "Past matches" },
  { value: "all", label: "All" },
];

export default function CricketAstrologyPage({ searchParams }: PageProps<"/cricket-astrology">) {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Trophy className="h-6 w-6" aria-hidden />
            <p className="eyebrow">Big Bash League</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Cricket Astrology</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">
            Audio readings that look at each BBL fixture through an astrological lens. Upcoming matches are listed first, and past
            readings stay in the archive.
          </p>
          <CricketDisclaimer className="mt-8 max-w-3xl" />
        </div>
      </section>
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/cricket-astrology">, "searchParams">) {
  const p = parseListParams(await searchParams);
  const query: EpisodeQuery = {
    section: "cricket",
    search: p.q || undefined,
    competitionSlug: p.competition || undefined,
    access: p.access || undefined,
    timing: p.when === "all" ? undefined : p.when,
    dateFrom: p.from || undefined,
    dateTo: p.to || undefined,
    sort: p.when === "upcoming" ? "match_date_asc" : "match_date_desc",
    limit: p.page * PAGE_SIZE,
  };
  const [{ items, total }, competitions] = await Promise.all([getEpisodes(query), getCompetitions()]);
  const filtered = !!(p.q || p.competition || p.access || p.from || p.to);

  return (
    <div className="space-y-8">
      <nav aria-label="Match timing" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = p.when === t.value;
          return (
            <Link
              key={t.value}
              href={`/cricket-astrology${toQueryString({ ...p, when: t.value, page: 1 }, { when: "upcoming" })}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-gold bg-gold/15 text-gold-soft" : "border-line text-ink/80 hover:border-gold/50"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Form action="/cricket-astrology" className="card grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <input type="hidden" name="when" value={p.when} />
        <div>
          <label htmlFor="q" className="label">Search team or match</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" name="q" defaultValue={p.q} placeholder="e.g. Sixers, Heat" className="input pl-9" />
          </div>
        </div>
        <div>
          <label htmlFor="competition" className="label">Competition</label>
          <select id="competition" name="competition" defaultValue={p.competition} className="input">
            <option value="">All competitions</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="access" className="label">Access</label>
          <select id="access" name="access" defaultValue={p.access} className="input">
            <option value="">Free and premium</option>
            <option value="free">Free only</option>
            <option value="premium">Premium only</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label">Match from</label>
          <input id="from" name="from" type="date" defaultValue={p.from} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">Match to</label>
          <input id="to" name="to" type="date" defaultValue={p.to} className="input" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-gold w-full lg:w-auto">Apply</button>
          {filtered && (
            <Link href={`/cricket-astrology${toQueryString({ when: p.when }, { when: "upcoming" })}`} className="btn-ghost">
              Clear
            </Link>
          )}
        </div>
      </Form>

      {items.length ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <MatchCard key={e.id} episode={e} />
            ))}
          </div>
          <LoadMore shown={items.length} total={total} href={`/cricket-astrology${toQueryString({ ...p, page: p.page + 1 }, { when: "upcoming" })}`} />
        </>
      ) : (
        <EmptyState title={filtered ? "No readings match these filters" : p.when === "upcoming" ? "No upcoming match readings yet" : "No match readings yet"}>
          {filtered ? "Try a different team name or widen the date range." : p.when === "upcoming" ? "Readings are published before each match. Check the past matches tab for the archive." : "Match readings will appear here once published."}
        </EmptyState>
      )}
    </div>
  );
}
