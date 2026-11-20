import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Trophy, UserRound } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { CRICKET_SERIES, SERIES_GENDERS } from "@/lib/topics";
import type { EpisodeQuery, Locale } from "@/lib/types";

/**
 * Cricket Matches on a page: BBL, IPL, T20 and ODI, each with its Men and Women sections.
 * The chips open each series on its own page (`page`/ipl); with `only`, just that series is shown.
 */
export function CricketSeries({
  query,
  render,
  navLabel,
  testId,
  page,
  only,
  lang,
}: {
  query: (competitionSlug: string) => EpisodeQuery;
  /** Shows a section's posts some other way than as cards. */
  render?: (query: EpisodeQuery) => ReactNode;
  navLabel: string;
  testId: string;
  /** The language-free address of the page, e.g. "/latest-matches"; its series pages are `${page}/ipl`. */
  page: string;
  /** A series id ("ipl"): show only that series. */
  only?: string;
  lang: Locale;
}) {
  const d = getDict(lang);
  const chip = (active: boolean) =>
    `chip border py-1.5 normal-case ${active ? "border-gold bg-gold text-night" : "border-line bg-white/5 text-ink/85 hover:border-gold/50 hover:text-gold-soft"}`;
  return (
    <section id="cricket" aria-labelledby="cricket-heading" className="container-page scroll-mt-24 space-y-14 py-10">
      <div className="space-y-4">
        <h2 id="cricket-heading" className="text-4xl font-semibold">{d.menu.matches}</h2>
        <nav aria-label={navLabel} className="flex flex-wrap gap-2">
          {only && (
            <Link href={localePath(lang, page)} className={chip(false)} data-testid={`${testId}-series-all`}>
              {d.topics.all}
            </Link>
          )}
          {CRICKET_SERIES.map((series) => (
            <Link
              key={series.id}
              href={localePath(lang, `${page}/${series.id}`)}
              className={chip(series.id === only)}
              aria-current={series.id === only ? "page" : undefined}
              data-testid={`${testId}-series-${series.id}`}
            >
              <Trophy className="h-4 w-4" aria-hidden /> {d.menu[series.key]}
            </Link>
          ))}
        </nav>
      </div>
      {CRICKET_SERIES.filter((series) => !only || series.id === only).map((series) => (
        <section key={series.id} id={series.id} aria-labelledby={`${series.id}-heading`} className="scroll-mt-24 space-y-8">
          <h3 id={`${series.id}-heading`} className="flex items-center gap-3 border-b border-line pb-3 text-3xl font-semibold">
            <Trophy className="h-6 w-6 text-gold-soft" aria-hidden /> {d.menu[series.key]}
          </h3>
          {SERIES_GENDERS.map((gender) => (
            <section key={gender} id={`${series.id}-${gender}`} aria-labelledby={`${series.id}-${gender}-heading`} className="scroll-mt-24 space-y-4" data-testid={`${testId}-${series.id}-${gender}`}>
              <h4 id={`${series.id}-${gender}-heading`} className="flex items-center gap-2 text-2xl font-semibold">
                <UserRound className="h-5 w-5 text-gold-soft" aria-hidden /> {d.menu[series.key]} · {d.menu[gender]}
              </h4>
              <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
                {render ? render(query(series[gender])) : <TopicPosts query={query(series[gender])} lang={lang} limit={60} />}
              </Suspense>
            </section>
          ))}
        </section>
      ))}
    </section>
  );
}

/** A series page's title and addresses, e.g. "IPL · Latest Matches" at /latest-matches/ipl. */
export function seriesPageMetadata(lang: Locale, page: string, topic: { title: string; intro: string }, seriesKey: keyof ReturnType<typeof getDict>["menu"], seriesId: string): Metadata {
  const title = `${getDict(lang).menu[seriesKey]} · ${topic.title}`;
  const path = `${page}/${seriesId}`;
  return { title, description: topic.intro, alternates: alternatesFor(lang, path), openGraph: { title, url: localePath(lang, path) } };
}
