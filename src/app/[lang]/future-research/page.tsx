import type { Metadata } from "next";
import { Suspense } from "react";
import { Bitcoin, Dices, Goal, Telescope, TrendingUp, type LucideIcon } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { FUTURE_TOPICS } from "@/lib/topics";
import type { EpisodeQuery, Locale } from "@/lib/types";

const ICONS: Record<(typeof FUTURE_TOPICS)[number]["key"], LucideIcon> = {
  footballAstro: Goal,
  shareMarket: TrendingUp,
  bitcoinForex: Bitcoin,
  lotteryNumber: Dices,
};

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.future;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/future-research"), openGraph: { title: t.title, url: localePath(l, "/future-research") } };
}

export default async function FutureResearchPage() {
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.future;
  return (
    <>
      <TopicHero icon={Telescope} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-14 py-10">
        <nav aria-label={t.title} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUTURE_TOPICS.map((topic) => {
            const Icon = ICONS[topic.key];
            return (
              <a key={topic.id} href={`#${topic.id}`} className="card group flex flex-col gap-3 p-5 hover:border-gold/50">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold-soft">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="font-display text-2xl font-semibold group-hover:text-gold-soft">{d.menu[topic.key]}</span>
                <span className="text-sm text-ink/80">{t[topic.key]}</span>
              </a>
            );
          })}
        </nav>
        {FUTURE_TOPICS.map((topic) => {
          const Icon = ICONS[topic.key];
          return (
            <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-heading`} className="scroll-mt-24 space-y-5" data-testid={`future-${topic.id}`}>
              <h2 id={`${topic.id}-heading`} className="flex items-center gap-3 text-3xl font-semibold">
                <Icon className="h-6 w-6 text-gold-soft" aria-hidden /> {d.menu[topic.key]}
              </h2>
              <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
                <TopicSection query={topic.query} lang={lang} body={t[topic.key]} note={t.soonNote} soon={d.topics.soon} />
              </Suspense>
            </section>
          );
        })}
      </section>
    </>
  );
}

/** A topic's posts, or a "coming soon" card while it has none. */
async function TopicSection({ query, lang, body, note, soon }: { query: EpisodeQuery; lang: Locale; body: string; note: string; soon: string }) {
  const { total } = await getEpisodes({ ...query, limit: 1 });
  if (total > 0) return <TopicPosts query={query} lang={lang} limit={60} />;
  return (
    <div className="card flex flex-col gap-2 border-dashed p-6" data-testid="future-soon">
      <span className="chip self-start border border-gold/40 bg-gold/10 py-1 text-gold-soft">{soon}</span>
      <p className="text-ink/85">{body}</p>
      <p className="text-sm text-muted">{note}</p>
    </div>
  );
}
