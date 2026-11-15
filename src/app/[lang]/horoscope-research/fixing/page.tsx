import type { Metadata } from "next";
import { Suspense } from "react";
import { Orbit } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.fixing;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/horoscope-research/fixing"), openGraph: { title: t.title, url: localePath(l, "/horoscope-research/fixing") } };
}

/** Horoscope Research › Fixing: matches where Rahu's impact showed, each with its Kundli link, newest match first. */
export default async function FixingPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.fixing;
  return (
    <>
      <TopicHero icon={Orbit} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page pb-14" data-testid="fixing-posts">
        <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
          <TopicPosts query={TOPICS.fixing} lang={lang} limit={120} />
        </Suspense>
      </section>
    </>
  );
}
