import type { Metadata } from "next";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { countPosts, TopicHero, TopicPosts, TopicTabs } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parseListParams } from "@/lib/list-params";
import { alternatesFor } from "@/lib/seo";
import { MATCH_COMPETITIONS, TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.matches;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/horoscope-research/matches") };
}

export default async function MatchesPage({ searchParams }: PageProps<"/[lang]/horoscope-research/matches">) {
  const lang = await getLang();
  const t = getDict(lang).topics.matches;
  return (
    <>
      <TopicHero icon={Trophy} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-8 py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/horoscope-research/matches">, "searchParams"> & { lang: Locale }) {
  const d = getDict(lang);
  const p = parseListParams(await searchParams);
  const competition = (MATCH_COMPETITIONS as readonly string[]).includes(p.competition) ? (p.competition as (typeof MATCH_COMPETITIONS)[number]) : undefined;
  const base = localePath(lang, "/horoscope-research/matches");
  const counts = await Promise.all([countPosts(TOPICS.matches), ...MATCH_COMPETITIONS.map((c) => countPosts({ ...TOPICS.matches, competitionSlug: c }))]);
  return (
    <>
      <TopicTabs
        label={d.menu.matches}
        tabs={[
          { label: d.topics.all, href: base, active: !competition, count: counts[0] },
          ...MATCH_COMPETITIONS.map((c, i) => ({ label: d.menu[c], href: `${base}?competition=${c}`, active: competition === c, count: counts[i + 1] })),
        ]}
      />
      <TopicPosts
        query={{ ...TOPICS.matches, competitionSlug: competition }}
        lang={lang}
        page={p.page}
        base={competition ? `${base}?competition=${competition}` : base}
      />
    </>
  );
}
