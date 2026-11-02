import type { Metadata } from "next";
import Link from "next/link";
import { Quote } from "lucide-react";
import { PhotoGallery } from "@/components/episodes/PhotoGallery";
import { CricketSeries } from "@/components/topics/CricketSeries";
import { TopicHero } from "@/components/topics/Topic";
import { EmptyState } from "@/components/ui/SectionHeading";
import { episodeHref } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { messagesQuery } from "@/lib/topics";
import type { EpisodeQuery, Locale } from "@/lib/types";

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
      <CricketSeries query={messagesQuery} render={(query) => <Messages query={query} lang={lang} />} navLabel={t.leagues} testId="testimonials" lang={lang} />
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
