import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Play } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { episodeHref, posterUrl } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode } from "@/lib/i18n";
import { getEpisodes } from "@/lib/queries";
import type { Locale } from "@/lib/types";

/** The latest reels as tall cards in a sideways-scrolling row. Renders nothing until a reel exists. */
export async function ReelsStrip({ lang }: { lang: Locale }) {
  const { items } = await getEpisodes({ format: "reel", sort: "latest", limit: 8 });
  if (items.length === 0) return null;
  const t = getDict(lang);
  return (
    <section className="container-page py-16" aria-labelledby="reels-heading" data-testid="reels-strip">
      <SectionHeading
        id="reels-heading"
        eyebrow={t.home.reelsEyebrow}
        title={t.home.reelsTitle}
        href={localePath(lang, "/astrology-audios?format=reel")}
        linkLabel={t.common.viewAll}
      />
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {items.map((raw) => {
          const e = localizeEpisode(raw, lang);
          const poster = posterUrl(e);
          return (
            <li key={e.id} className="w-40 shrink-0 snap-start sm:w-48">
              <Link href={episodeHref(e, lang)} className="group block space-y-2" data-testid="reel-card">
                <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-plum">
                  {poster ? (
                    <Image src={poster} alt="" fill sizes="192px" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-plum-2 via-plum to-navy">
                      <Clapperboard className="h-8 w-8 text-gold-soft" aria-hidden />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent" />
                  <span className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-night/70 text-gold-soft">
                    <Play className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold group-hover:text-gold-soft" lang={e.text_lang}>{e.title}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
