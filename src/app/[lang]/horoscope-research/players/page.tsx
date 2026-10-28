import type { Metadata } from "next";
import { Suspense } from "react";
import { Users } from "lucide-react";
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
  const t = getDict(l).topics.players;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/horoscope-research/players") };
}

export default async function PlayersPage({ searchParams }: PageProps<"/[lang]/horoscope-research/players">) {
  const lang = await getLang();
  const t = getDict(lang).topics.players;
  return (
    <>
      <TopicHero icon={Users} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/horoscope-research/players">, "searchParams"> & { lang: Locale }) {
  const p = parseListParams(await searchParams);
  return <TopicPosts query={TOPICS.players} lang={lang} page={p.page} base={localePath(lang, "/horoscope-research/players")} />;
}
