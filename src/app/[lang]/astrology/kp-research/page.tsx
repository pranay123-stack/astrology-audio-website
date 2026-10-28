import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Compass, Telescope } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parseListParams } from "@/lib/list-params";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.kpResearch;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/astrology/kp-research") };
}

export default async function KpResearchPage({ searchParams }: PageProps<"/[lang]/astrology/kp-research">) {
  const lang = await getLang();
  const t = getDict(lang).topics.kpResearch;
  return (
    <>
      <TopicHero icon={Telescope} eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
        <Link href={localePath(lang, "/kp-chart")} className="btn-gold">
          <Compass className="h-4 w-4" aria-hidden /> {t.chartCta}
        </Link>
      </TopicHero>
      <section className="container-page space-y-14 py-10">
        <section aria-labelledby="kp-research-heading">
          <SectionHeading id="kp-research-heading" eyebrow={t.eyebrow} title={t.researchTitle} />
          <Suspense fallback={<ListingSkeleton lang={lang} />}>
            <Results searchParams={searchParams} lang={lang} />
          </Suspense>
        </section>
        <section aria-labelledby="kp-guide-heading" data-testid="kp-guide">
          <SectionHeading id="kp-guide-heading" eyebrow={t.eyebrow} title={t.guideTitle} />
          <Suspense fallback={<ListingSkeleton lang={lang} />}>
            <TopicPosts query={TOPICS.kpGuide} lang={lang} limit={30} />
          </Suspense>
        </section>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/astrology/kp-research">, "searchParams"> & { lang: Locale }) {
  const p = parseListParams(await searchParams);
  return <TopicPosts query={TOPICS.kpResearch} lang={lang} page={p.page} base={localePath(lang, "/astrology/kp-research")} />;
}
