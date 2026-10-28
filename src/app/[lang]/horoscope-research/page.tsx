import type { Metadata } from "next";
import { Suspense } from "react";
import { ScrollText, Trophy, Users } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { countPosts, HubCard, TopicHero, TopicPosts } from "@/components/topics/Topic";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { MATCH_COMPETITIONS, TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.research;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/horoscope-research"), openGraph: { title: t.title, url: localePath(l, "/horoscope-research") } };
}

export default async function HoroscopeResearchPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.research;
  return (
    <>
      <TopicHero icon={ScrollText} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-14 py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Hub lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Hub({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const t = d.topics.research;
  const href = (p: string) => localePath(lang, p);
  const [matches, byCompetition, players] = await Promise.all([
    countPosts(TOPICS.matches),
    Promise.all(MATCH_COMPETITIONS.map((c) => countPosts({ ...TOPICS.matches, competitionSlug: c }))),
    countPosts(TOPICS.players),
  ]);
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <HubCard
          icon={Trophy}
          title={d.menu.matches}
          body={t.matchesBody}
          href={href("/horoscope-research/matches")}
          count={matches}
          links={MATCH_COMPETITIONS.map((c, i) => ({ label: d.menu[c], href: href(`/horoscope-research/matches?competition=${c}`), count: byCompetition[i] }))}
          lang={lang}
          testId="hub-matches"
        />
        <HubCard icon={Users} title={d.menu.players} body={t.playersBody} href={href("/horoscope-research/players")} count={players} lang={lang} testId="hub-players" />
      </div>
      <section aria-labelledby="research-latest">
        <SectionHeading id="research-latest" eyebrow={d.topics.latest} title={d.menu.matches} />
        <TopicPosts query={TOPICS.matches} lang={lang} limit={6} />
      </section>
    </>
  );
}
