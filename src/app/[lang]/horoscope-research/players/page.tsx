import type { Metadata } from "next";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { PlayerSearch } from "@/components/topics/PlayerSearch";
import { TopicHero } from "@/components/topics/Topic";
import { EmptyState } from "@/components/ui/SectionHeading";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.players;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/horoscope-research/players") };
}

export default async function PlayersPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.players;
  return (
    <>
      <TopicHero icon={Users} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Players lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

/** Every player, so the search can narrow them straight away as a name is typed. */
async function Players({ lang }: { lang: Locale }) {
  const d = getDict(lang).topics;
  const { items } = await getEpisodes({ ...TOPICS.players, limit: 500 });
  if (!items.length) return <EmptyState title={d.emptyTitle}>{d.emptyBody}</EmptyState>;
  return (
    <PlayerSearch
      players={items.map((e, i) => ({
        id: e.id,
        name: `${e.title} ${e.title_alt}`.replace(/[–-]\s*KP Horoscope/i, ""),
        card: <EpisodeCard episode={e} lang={lang} priority={i < 3} />,
      }))}
      lang={lang}
    />
  );
}
