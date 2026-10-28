import type { Metadata } from "next";
import { Suspense } from "react";
import { Orbit } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { countPosts, TopicHero, TopicPosts, TopicTabs } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parseListParams } from "@/lib/list-params";
import { alternatesFor } from "@/lib/seo";
import { PLANET_FORMATS, TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.planetsBhav;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/astrology/planets-bhav") };
}

export default async function PlanetsBhavPage({ searchParams }: PageProps<"/[lang]/astrology/planets-bhav">) {
  const lang = await getLang();
  const t = getDict(lang).topics.planetsBhav;
  return (
    <>
      <TopicHero icon={Orbit} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-8 py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/astrology/planets-bhav">, "searchParams"> & { lang: Locale }) {
  const d = getDict(lang);
  const p = parseListParams(await searchParams);
  const format = (PLANET_FORMATS as readonly string[]).includes(p.format) ? (p.format as (typeof PLANET_FORMATS)[number]) : undefined;
  const base = localePath(lang, "/astrology/planets-bhav");
  const label = { video: d.menu.video, audio: d.menu.audio, article: d.menu.read };
  const counts = await Promise.all([countPosts(TOPICS.planetsBhav), ...PLANET_FORMATS.map((f) => countPosts({ ...TOPICS.planetsBhav, format: f }))]);
  return (
    <>
      <TopicTabs
        label={d.menu.planetsBhav}
        tabs={[
          { label: d.topics.all, href: base, active: !format, count: counts[0] },
          ...PLANET_FORMATS.map((f, i) => ({ label: label[f], href: `${base}?format=${f}`, active: format === f, count: counts[i + 1] })),
        ]}
      />
      <TopicPosts query={{ ...TOPICS.planetsBhav, format }} lang={lang} page={p.page} base={format ? `${base}?format=${format}` : base} />
    </>
  );
}
