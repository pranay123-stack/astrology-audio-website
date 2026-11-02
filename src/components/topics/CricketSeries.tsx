import { Suspense, type ReactNode } from "react";
import { Trophy, UserRound } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicPosts } from "@/components/topics/Topic";
import { getDict } from "@/lib/i18n";
import { CRICKET_SERIES, SERIES_GENDERS } from "@/lib/topics";
import type { EpisodeQuery, Locale } from "@/lib/types";

/** Cricket Matches on a page: BBL, IPL, T20 and ODI, each with its Men and Women sections. */
export function CricketSeries({
  query,
  render,
  navLabel,
  testId,
  lang,
}: {
  query: (competitionSlug: string) => EpisodeQuery;
  /** Shows a section's posts some other way than as cards. */
  render?: (query: EpisodeQuery) => ReactNode;
  navLabel: string;
  testId: string;
  lang: Locale;
}) {
  const d = getDict(lang);
  return (
    <section id="cricket" aria-labelledby="cricket-heading" className="container-page scroll-mt-24 space-y-14 py-10">
      <div className="space-y-4">
        <h2 id="cricket-heading" className="text-4xl font-semibold">{d.menu.matches}</h2>
        <nav aria-label={navLabel} className="flex flex-wrap gap-2">
          {CRICKET_SERIES.map((series) => (
            <a key={series.id} href={`#${series.id}`} className="chip border border-line bg-white/5 py-1.5 normal-case text-ink/85 hover:border-gold/50 hover:text-gold-soft">
              <Trophy className="h-4 w-4" aria-hidden /> {d.menu[series.key]}
            </a>
          ))}
        </nav>
      </div>
      {CRICKET_SERIES.map((series) => (
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
