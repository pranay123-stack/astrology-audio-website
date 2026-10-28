import type { Metadata } from "next";
import { Suspense } from "react";
import { Clapperboard } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parseListParams } from "@/lib/list-params";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.podcast;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/astro-cricket/videos") };
}

export default async function PodcastPage({ searchParams }: PageProps<"/[lang]/astro-cricket/videos">) {
  const lang = await getLang();
  const t = getDict(lang).topics.podcast;
  return (
    <>
      <TopicHero icon={Clapperboard} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/astro-cricket/videos">, "searchParams"> & { lang: Locale }) {
  const p = parseListParams(await searchParams);
  return <TopicPosts query={TOPICS.podcast} lang={lang} page={p.page} base={localePath(lang, "/astro-cricket/videos")} />;
}
