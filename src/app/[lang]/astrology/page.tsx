import type { Metadata } from "next";
import { Suspense } from "react";
import { Orbit, Sparkles, Telescope } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { countPosts, HubCard, TopicHero, TopicPosts } from "@/components/topics/Topic";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { PLANET_FORMATS, TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.astrology;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/astrology"), openGraph: { title: t.title, url: localePath(l, "/astrology") } };
}

export default async function AstrologyPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.astrology;
  return (
    <>
      <TopicHero icon={Sparkles} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
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
  const t = d.topics.astrology;
  const href = (p: string) => localePath(lang, p);
  const [planets, formats, kpResearch, kpGuide] = await Promise.all([
    countPosts(TOPICS.planetsBhav),
    Promise.all(PLANET_FORMATS.map((f) => countPosts({ ...TOPICS.planetsBhav, format: f }))),
    countPosts(TOPICS.kpResearch),
    countPosts(TOPICS.kpGuide),
  ]);
  const kp = kpResearch + kpGuide;
  const formatLabel = { video: d.menu.video, audio: d.menu.audio, article: d.menu.read };
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <HubCard
          icon={Orbit}
          title={d.menu.planetsBhav}
          body={t.planetsBhavBody}
          href={href("/astrology/planets-bhav")}
          count={planets}
          links={PLANET_FORMATS.map((f, i) => ({ label: formatLabel[f], href: href(`/astrology/planets-bhav?format=${f}`), count: formats[i] }))}
          lang={lang}
          testId="hub-planets-bhav"
        />
        <HubCard
          icon={Telescope}
          title={d.menu.kpAstrology}
          body={t.kpBody}
          href={href("/astrology/kp-research")}
          count={kp}
          links={[{ label: d.menu.kpResearch, href: href("/astrology/kp-research") }, { label: d.menu.kpChart, href: href("/kp-chart") }]}
          lang={lang}
          testId="hub-kp"
        />
      </div>
      <section aria-labelledby="astrology-latest">
        <SectionHeading id="astrology-latest" eyebrow={d.topics.latest} title={d.menu.astrology} />
        {/* Newest posts from the whole astrology section. */}
        <TopicPosts query={{ section: "general", sort: "latest" }} lang={lang} limit={6} />
      </section>
    </>
  );
}
