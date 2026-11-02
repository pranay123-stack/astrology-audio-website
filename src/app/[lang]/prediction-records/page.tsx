import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { CricketSeries } from "@/components/topics/CricketSeries";
import { TopicHero } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { predictionQuery } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.predictionRecords;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/prediction-records"), openGraph: { title: t.title, url: localePath(l, "/prediction-records") } };
}

/** Prediction Records: match audio with its data, by competition, men and women, newest match first. */
export default async function PredictionRecordsPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.predictionRecords;
  return (
    <>
      <TopicHero icon={ClipboardList} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <CricketSeries query={predictionQuery} navLabel={t.leagues} testId="predictions" lang={lang} />
    </>
  );
}
