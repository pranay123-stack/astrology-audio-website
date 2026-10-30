import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Headphones, MessageSquareQuote, Quote, Trophy } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { PhotoGallery } from "@/components/episodes/PhotoGallery";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { EmptyState } from "@/components/ui/SectionHeading";
import { episodeHref } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { TESTIMONIAL_LEAGUES, testimonialQueries } from "@/lib/topics";
import type { EpisodeQuery, Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.testimonials;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/testimonials"), openGraph: { title: t.title, url: localePath(l, "/testimonials") } };
}

export default async function TestimonialsPage() {
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.testimonials;
  return (
    <>
      <TopicHero icon={Quote} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-20 py-10">
        <nav aria-label={t.leagues} className="flex flex-wrap gap-2">
          {TESTIMONIAL_LEAGUES.map((league) => (
            <a key={league.id} href={`#${league.id}`} className="chip border border-line bg-white/5 py-1.5 normal-case text-ink/85 hover:border-gold/50 hover:text-gold-soft">
              <Trophy className="h-4 w-4" aria-hidden /> {d.menu[league.key]}
            </a>
          ))}
        </nav>
        {TESTIMONIAL_LEAGUES.map((league) => {
          const q = testimonialQueries(league);
          return (
            <section key={league.id} id={league.id} aria-labelledby={`${league.id}-heading`} className="scroll-mt-24 space-y-10" data-testid={`testimonials-${league.id}`}>
              <h2 id={`${league.id}-heading`} className="flex items-center gap-3 border-b border-line pb-3 text-4xl font-semibold">
                <Trophy className="h-7 w-7 text-gold-soft" aria-hidden /> {d.menu[league.key]}
              </h2>
              <section id={`${league.id}-audio`} aria-labelledby={`${league.id}-audio-heading`} className="scroll-mt-24 space-y-5" data-testid={`testimonials-${league.id}-audio`}>
                <div className="space-y-2">
                  <h3 id={`${league.id}-audio-heading`} className="flex items-center gap-3 text-3xl font-semibold">
                    <Headphones className="h-6 w-6 text-gold-soft" aria-hidden /> {t.audio}
                  </h3>
                  <p className="max-w-2xl text-ink/80">{t.audioIntro}</p>
                </div>
                <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
                  <TopicPosts query={q.audio} lang={lang} limit={60} />
                </Suspense>
              </section>
              <section id={`${league.id}-messages`} aria-labelledby={`${league.id}-messages-heading`} className="scroll-mt-24 space-y-5" data-testid={`testimonials-${league.id}-messages`}>
                <div className="space-y-2">
                  <h3 id={`${league.id}-messages-heading`} className="flex items-center gap-3 text-3xl font-semibold">
                    <MessageSquareQuote className="h-6 w-6 text-gold-soft" aria-hidden /> {t.messages}
                  </h3>
                  <p className="max-w-2xl text-ink/80">{t.messagesIntro}</p>
                </div>
                <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
                  <Messages query={q.messages} lang={lang} />
                </Suspense>
              </section>
            </section>
          );
        })}
      </section>
    </>
  );
}

/** Each message post: its title and its screenshots (the post's photos), which open full size. */
async function Messages({ query, lang }: { query: EpisodeQuery; lang: Locale }) {
  const d = getDict(lang);
  const { items } = await getEpisodes({ ...query, limit: 60 });
  if (!items.length) return <EmptyState title={d.topics.emptyTitle}>{d.topics.emptyBody}</EmptyState>;
  return (
    <div className="space-y-10">
      {items.map((raw) => {
        const e = localizeEpisode(raw, lang);
        return (
          <article key={e.id} className="card space-y-4 p-5" data-testid="message-proof">
            <h3 className="text-2xl font-semibold" lang={e.text_lang}>
              <Link href={episodeHref(e, lang)} className="hover:text-gold-soft">{e.title}</Link>
            </h3>
            {e.excerpt && <p className="text-sm text-ink/80" lang={e.text_lang}>{e.excerpt}</p>}
            {e.gallery_paths.length > 0 && <PhotoGallery paths={e.gallery_paths} title={e.title} titleLang={e.text_lang} />}
          </article>
        );
      })}
    </div>
  );
}
