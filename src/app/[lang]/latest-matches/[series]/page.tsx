import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Radio } from "lucide-react";
import { CricketSeries, seriesPageMetadata } from "@/components/topics/CricketSeries";
import { TopicHero } from "@/components/topics/Topic";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { findSeries, latestQuery, seriesStaticParams } from "@/lib/topics";

export const generateStaticParams = seriesStaticParams;

export async function generateMetadata({ params }: PageProps<"/[lang]/latest-matches/[series]">): Promise<Metadata> {
  const series = findSeries((await params).series);
  if (!series) return {};
  const lang = await getLang();
  return seriesPageMetadata(lang, "/latest-matches", getDict(lang).topics.latestMatches, series.key, series.id);
}

/** One series of latest-matches on its own page (e.g. /latest-matches/ipl): its Men and Women sections, nothing else. */
export default async function SeriesPage({ params }: PageProps<"/[lang]/latest-matches/[series]">) {
  const series = findSeries((await params).series);
  if (!series) notFound();
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.latestMatches;
  return (
    <>
      <TopicHero icon={Radio} eyebrow={t.title} title={d.menu[series.key]} intro={t.intro} />
      <CricketSeries query={latestQuery} navLabel={t.series} testId="latest" page="/latest-matches" only={series.id} lang={lang} />
    </>
  );
}
