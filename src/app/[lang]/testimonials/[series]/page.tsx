import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quote } from "lucide-react";
import { CricketSeries, seriesPageMetadata } from "@/components/topics/CricketSeries";
import { MessageProofs } from "@/components/topics/MessageProofs";
import { TopicHero } from "@/components/topics/Topic";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { findSeries, messagesQuery, seriesStaticParams } from "@/lib/topics";

export const generateStaticParams = seriesStaticParams;

export async function generateMetadata({ params }: PageProps<"/[lang]/testimonials/[series]">): Promise<Metadata> {
  const series = findSeries((await params).series);
  if (!series) return {};
  const lang = await getLang();
  return seriesPageMetadata(lang, "/testimonials", getDict(lang).topics.testimonials, series.key, series.id);
}

/** One series of testimonials on its own page (e.g. /testimonials/ipl): its Men and Women sections, nothing else. */
export default async function SeriesPage({ params }: PageProps<"/[lang]/testimonials/[series]">) {
  const series = findSeries((await params).series);
  if (!series) notFound();
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.testimonials;
  return (
    <>
      <TopicHero icon={Quote} eyebrow={t.title} title={d.menu[series.key]} intro={t.intro} />
      <CricketSeries query={messagesQuery} render={(query) => <MessageProofs query={query} lang={lang} />} navLabel={t.leagues} testId="testimonials" page="/testimonials" only={series.id} lang={lang} />
    </>
  );
}
