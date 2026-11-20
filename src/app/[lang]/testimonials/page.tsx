import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { CricketSeries } from "@/components/topics/CricketSeries";
import { MessageProofs } from "@/components/topics/MessageProofs";
import { TopicHero } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { messagesQuery } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.testimonials;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/testimonials"), openGraph: { title: t.title, url: localePath(l, "/testimonials") } };
}

export default async function TestimonialsPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.testimonials;
  return (
    <>
      <TopicHero icon={Quote} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <CricketSeries query={messagesQuery} render={(query) => <MessageProofs query={query} lang={lang} />} navLabel={t.leagues} testId="testimonials" page="/testimonials" lang={lang} />
    </>
  );
}
