import type { Metadata } from "next";
import { Suspense } from "react";
import { GraduationCap, Radio } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { CricketSeries } from "@/components/topics/CricketSeries";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { latestQuery, TOPICS } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.latestMatches;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/latest-matches"), openGraph: { title: t.title, url: localePath(l, "/latest-matches") } };
}

/**
 * Latest Matches › Cricket Matches (BBL, IPL, T20 and ODI, each for men and for women, newest match first)
 * and › Course Teaching (lessons in course order, lesson 1 first).
 */
export default async function LatestMatchesPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.latestMatches;
  return (
    <>
      <TopicHero icon={Radio} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <CricketSeries query={latestQuery} navLabel={t.series} testId="latest" page="/latest-matches" lang={lang} />
      <section id="course-teaching" aria-labelledby="course-teaching-heading" className="container-page scroll-mt-24 space-y-4 pb-14" data-testid="latest-course-teaching">
        <h2 id="course-teaching-heading" className="flex items-center gap-3 border-b border-line pb-3 text-4xl font-semibold">
          <GraduationCap className="h-7 w-7 text-gold-soft" aria-hidden /> {getDict(lang).menu.courseTeaching}
        </h2>
        <p className="max-w-3xl text-muted">{t.teachingIntro}</p>
        <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
          <TopicPosts query={TOPICS.courseTeaching} lang={lang} limit={120} />
        </Suspense>
      </section>
    </>
  );
}
