import type { Metadata } from "next";
import { Suspense } from "react";
import { ClipboardList, Headphones, Trophy } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { LEAGUES, predictionQuery } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.predictionRecords;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/prediction-records"), openGraph: { title: t.title, url: localePath(l, "/prediction-records") } };
}

/** Prediction Records: each league's match audio with its data, newest match first. */
export default async function PredictionRecordsPage() {
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.predictionRecords;
  return (
    <>
      <TopicHero icon={ClipboardList} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-16 py-10">
        <nav aria-label={t.leagues} className="flex flex-wrap gap-2">
          {LEAGUES.map((league) => (
            <a key={league.id} href={`#${league.id}`} className="chip border border-line bg-white/5 py-1.5 normal-case text-ink/85 hover:border-gold/50 hover:text-gold-soft">
              <Trophy className="h-4 w-4" aria-hidden /> {d.menu[league.key]}
            </a>
          ))}
        </nav>
        {LEAGUES.map((league) => (
          <section key={league.id} id={league.id} aria-labelledby={`${league.id}-heading`} className="scroll-mt-24 space-y-5" data-testid={`predictions-${league.id}`}>
            <h2 id={`${league.id}-heading`} className="flex items-center gap-3 text-4xl font-semibold">
              <Headphones className="h-7 w-7 text-gold-soft" aria-hidden /> {d.menu[league.key]} · {t.audio}
            </h2>
            <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
              <TopicPosts query={predictionQuery(league)} lang={lang} limit={60} />
            </Suspense>
          </section>
        ))}
      </section>
    </>
  );
}
