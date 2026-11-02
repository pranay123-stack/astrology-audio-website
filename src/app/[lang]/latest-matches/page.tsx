import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { CricketSeries } from "@/components/topics/CricketSeries";
import { TopicHero } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { latestQuery } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.latestMatches;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/latest-matches"), openGraph: { title: t.title, url: localePath(l, "/latest-matches") } };
}

/** Latest Matches › Cricket Matches: BBL, IPL, T20 and ODI, each for men and for women, newest match first. */
export default async function LatestMatchesPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.latestMatches;
  return (
    <>
      <TopicHero icon={Radio} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <CricketSeries query={latestQuery} navLabel={t.series} testId="latest" lang={lang} />
    </>
  );
}
