import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Headphones, MessageSquareQuote, Quote } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { PhotoGallery } from "@/components/episodes/PhotoGallery";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { EmptyState } from "@/components/ui/SectionHeading";
import { episodeHref } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.testimonials;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/testimonials"), openGraph: { title: t.title, url: localePath(l, "/testimonials") } };
}

export default async function TestimonialsPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.testimonials;
  return (
    <>
      <TopicHero icon={Quote} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-16 py-10">
        <section id="audio" aria-labelledby="audio-heading" className="scroll-mt-24 space-y-5" data-testid="testimonials-audio">
          <div className="space-y-2">
            <h2 id="audio-heading" className="flex items-center gap-3 text-4xl font-semibold">
              <Headphones className="h-7 w-7 text-gold-soft" aria-hidden /> {t.audio}
            </h2>
            <p className="max-w-2xl text-ink/80">{t.audioIntro}</p>
          </div>
          <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
            <TopicPosts query={TOPICS.testimonialAudio} lang={lang} limit={60} />
          </Suspense>
        </section>
        <section id="messages" aria-labelledby="messages-heading" className="scroll-mt-24 space-y-5" data-testid="testimonials-messages">
          <div className="space-y-2">
            <h2 id="messages-heading" className="flex items-center gap-3 text-4xl font-semibold">
              <MessageSquareQuote className="h-7 w-7 text-gold-soft" aria-hidden /> {t.messages}
            </h2>
            <p className="max-w-2xl text-ink/80">{t.messagesIntro}</p>
          </div>
          <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
            <Messages lang={lang} />
          </Suspense>
        </section>
      </section>
    </>
  );
}

/** Each message post: its title and its screenshots (the post's photos), which open full size. */
async function Messages({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const { items } = await getEpisodes({ ...TOPICS.testimonialMessages, limit: 60 });
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
