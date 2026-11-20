import Link from "next/link";
import { PhotoGallery } from "@/components/episodes/PhotoGallery";
import { EmptyState } from "@/components/ui/SectionHeading";
import { episodeHref } from "@/lib/episodes";
import { getDict, localizeEpisode } from "@/lib/i18n";
import { getEpisodes } from "@/lib/queries";
import type { EpisodeQuery, Locale } from "@/lib/types";

/** Testimonials: each message post, its title and its screenshots (the post's photos), which open full size. */
export async function MessageProofs({ query, lang }: { query: EpisodeQuery; lang: Locale }) {
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
