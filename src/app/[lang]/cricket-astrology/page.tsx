import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Trophy } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { FormatChips } from "@/components/episodes/FormatChips";
import { HeroMatch } from "@/components/episodes/HeroMatch";
import { LearnCricketCta } from "@/components/episodes/LearnCricketCta";
import { LoadMore } from "@/components/episodes/LoadMore";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { MatchCard } from "@/components/episodes/MatchCard";
import { Starfield } from "@/components/layout/Starfield";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import { PAGE_SIZE, parseListParams, toQueryString, type ListParams } from "@/lib/list-params";
import { getCompetitions, getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import type { EpisodeQuery, Locale } from "@/lib/types";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).cricket;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: alternatesFor(l, "/cricket-astrology"),
    openGraph: { title: t.metaTitle, url: localePath(l, "/cricket-astrology") },
  };
}

const TABS: ListParams["when"][] = ["upcoming", "past", "all"];

export default async function CricketAstrologyPage({ searchParams }: PageProps<"/[lang]/cricket-astrology">) {
  const lang = await getLang();
  const t = getDict(lang).cricket;
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-gold-soft">
              <Trophy className="h-6 w-6" aria-hidden />
              <p className="eyebrow">{t.eyebrow}</p>
            </div>
            <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro}</p>
            <CricketDisclaimer lang={lang} className="mt-8 max-w-3xl" />
          </div>
          <NextMatch lang={lang} />
        </div>
      </section>
      {/* The type filter reads the URL, so the unfiltered guide is the static fallback. */}
      <Suspense fallback={<CricketGuide lang={lang} />}>
        <FilteredCricketGuide searchParams={searchParams} lang={lang} />
      </Suspense>
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function FilteredCricketGuide({ searchParams, lang }: Pick<PageProps<"/[lang]/cricket-astrology">, "searchParams"> & { lang: Locale }) {
  const p = parseListParams(await searchParams);
  return <CricketGuide lang={lang} params={p} />;
}

/** General posts on how cricket astrology works (articles, audio, videos), with an invitation to learn it. */
async function CricketGuide({ lang, params }: { lang: Locale; params?: ListParams }) {
  const t = getDict(lang).cricket;
  const format = params?.format || undefined;
  const [{ items }, all] = await Promise.all([
    getEpisodes({ categorySlug: "cricket-astrology-guide", format, sort: "latest", limit: 24 }),
    format ? getEpisodes({ categorySlug: "cricket-astrology-guide" }) : null,
  ]);
  if (items.length === 0 && !format) return null;
  return (
    <section className="container-page py-12" aria-labelledby="guide-heading" data-testid="cricket-guide">
      <SectionHeading id="guide-heading" eyebrow={t.guideEyebrow} title={t.guideTitle} description={t.guideDesc} />
      <FormatChips
        posts={(all ?? { items }).items}
        params={{ format: params?.format ?? "", when: params?.when }}
        base={localePath(lang, "/cricket-astrology")}
        defaults={{ when: "upcoming" }}
        lang={lang}
      />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <EpisodeCard key={e.id} episode={e} lang={lang} />
        ))}
      </div>
      <LearnCricketCta lang={lang} className="mt-10" />
    </section>
  );
}

/** The next upcoming match reading (or the latest one), with a live countdown. Cached data only, so it is part of the static shell. */
async function NextMatch({ lang }: { lang: Locale }) {
  const [upcoming, recent] = await Promise.all([
    getEpisodes({ section: "cricket", withMatch: true, timing: "upcoming", sort: "match_date_asc", limit: 1 }),
    getEpisodes({ section: "cricket", withMatch: true, sort: "latest", limit: 1 }),
  ]);
  const episode = upcoming.items[0] ?? recent.items[0];
  if (!episode?.match) return null;
  return (
    <div className="mx-auto w-full max-w-md lg:max-w-lg">
      <HeroMatch episode={episode} upcoming={upcoming.items.length > 0} lang={lang} />
    </div>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/cricket-astrology">, "searchParams"> & { lang: Locale }) {
  const d = getDict(lang);
  const t = d.cricket;
  const base = localePath(lang, "/cricket-astrology");
  const p = parseListParams(await searchParams);
  const query: EpisodeQuery = {
    section: "cricket",
    withMatch: true,
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
  const tabLabel = { upcoming: t.upcoming, past: t.past, all: t.all };

  return (
    <div className="space-y-8">
      <nav aria-label={t.timingNav} className="flex flex-wrap gap-2">
        {TABS.map((when) => {
          const active = p.when === when;
          return (
            <Link
              key={when}
              href={`${base}${toQueryString({ ...p, when, page: 1 }, { when: "upcoming" })}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-gold bg-gold/15 text-gold-soft" : "border-line text-ink/80 hover:border-gold/50"
              }`}
            >
              {tabLabel[when]}
            </Link>
          );
        })}
      </nav>

      <Form action={base} className="card grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <input type="hidden" name="when" value={p.when} />
        <div>
          <label htmlFor="q" className="label">{t.searchLabel}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" name="q" defaultValue={p.q} placeholder={t.searchPlaceholder} className="input pl-9" />
          </div>
        </div>
        <div>
          <label htmlFor="competition" className="label">{t.competition}</label>
          <select id="competition" name="competition" defaultValue={p.competition} className="input">
            <option value="">{t.allCompetitions}</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="access" className="label">{d.common.access}</label>
          <select id="access" name="access" defaultValue={p.access} className="input">
            <option value="">{d.common.freeAndPremium}</option>
            <option value="free">{d.common.freeOnly}</option>
            <option value="premium">{d.common.premiumOnly}</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label">{t.from}</label>
          <input id="from" name="from" type="date" defaultValue={p.from} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">{t.to}</label>
          <input id="to" name="to" type="date" defaultValue={p.to} className="input" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-gold w-full lg:w-auto">{d.common.apply}</button>
          {filtered && (
            <Link href={`${base}${toQueryString({ when: p.when }, { when: "upcoming" })}`} className="btn-ghost">
              {d.common.clear}
            </Link>
          )}
        </div>
      </Form>

      {items.length ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <MatchCard key={e.id} episode={e} lang={lang} />
            ))}
          </div>
          <LoadMore
            lang={lang}
            shown={items.length}
            total={total}
            href={`${base}${toQueryString({ ...p, page: p.page + 1 }, { when: "upcoming" })}`}
          />
        </>
      ) : (
        <EmptyState title={filtered ? t.noMatchFiltered : p.when === "upcoming" ? t.noUpcoming : t.none}>
          {filtered ? t.filteredBody : p.when === "upcoming" ? t.upcomingBody : t.noneBody}
        </EmptyState>
      )}
    </div>
  );
}
