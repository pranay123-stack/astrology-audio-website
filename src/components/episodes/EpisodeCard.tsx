import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { AccessBadge, CategoryChip, DemoBadge, FormatBadges, LanguageBadge } from "@/components/ui/Badges";
import { formatDate } from "@/lib/dates";
import { episodeHref, hasArticle, hasAudio, hasDriveAudio, hasVideo, lengthLabel, posterUrl } from "@/lib/episodes";
import { localizeEpisode } from "@/lib/i18n";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CategoryIcon } from "./categoryIcons";
import { MediaAction } from "./MediaAction";
import type { EpisodeListing, Locale } from "@/lib/types";

export function EpisodeCard({ episode: raw, lang, priority = false }: { episode: EpisodeListing; lang: Locale; priority?: boolean }) {
  const episode = localizeEpisode(raw, lang);
  const href = episodeHref(episode, lang);
  const cover = posterUrl(episode);
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]" data-testid="episode-card" data-episode-id={episode.id}>
      <div className="relative aspect-[16/10] overflow-hidden bg-plum">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        )}
        {!cover && (
          // No cover art (common for articles): a themed panel instead of an empty box.
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-plum-2 via-plum to-navy" data-testid="card-cover-fallback">
            <ZodiacWheel className="absolute h-[130%] opacity-20" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-night/60 text-gold-soft">
              <CategoryIcon slug={episode.category.slug} className="h-7 w-7" />
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <AccessBadge premium={episode.is_premium} lang={lang} />
          {episode.is_demo && <DemoBadge lang={lang} />}
        </div>
        <div className="absolute right-4 bottom-4">
          <MediaAction episode={episode} lang={lang} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip>{episode.category.name}</CategoryChip>
          <FormatBadges
            audio={hasAudio(episode) || hasDriveAudio(episode)}
            article={hasArticle(episode)}
            video={hasVideo(episode) ? episode.video_format : null}
            photos={episode.gallery_paths.length > 0}
            lang={lang}
          />
          <LanguageBadge textLang={episode.text_lang} lang={lang} />
        </div>
        <h3 className="text-2xl leading-tight font-semibold" lang={episode.text_lang}>
          <Link href={href} className="hover:text-gold-soft">
            {episode.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted" lang={episode.text_lang}>{episode.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={episode.published_at ?? undefined}>{formatDate(episode.published_at, lang)}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {lengthLabel(episode, lang)}
          </span>
        </div>
      </div>
    </article>
  );
}
