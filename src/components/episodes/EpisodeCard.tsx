import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { PlayButton } from "@/components/audio/PlayButton";
import { AccessBadge, CategoryChip, DemoBadge } from "@/components/ui/Badges";
import { formatDate, formatDurationLabel } from "@/lib/dates";
import { episodeHref, isLockedForVisitors, toTrack } from "@/lib/episodes";
import { imageUrl } from "@/lib/media/urls";
import type { EpisodeListing } from "@/lib/types";

export function EpisodeCard({ episode, priority = false }: { episode: EpisodeListing; priority?: boolean }) {
  const href = episodeHref(episode);
  const cover = imageUrl(episode.cover_image_path);
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]" data-testid="episode-card">
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
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <AccessBadge premium={episode.is_premium} />
          {episode.is_demo && <DemoBadge />}
        </div>
        <div className="absolute right-4 bottom-4">
          <PlayButton track={toTrack(episode)} locked={isLockedForVisitors(episode)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryChip>{episode.category.name}</CategoryChip>
        <h3 className="text-2xl leading-tight font-semibold">
          <Link href={href} className="hover:text-gold-soft">
            {episode.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{episode.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={episode.published_at ?? undefined}>{formatDate(episode.published_at)}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDurationLabel(episode.duration_seconds)}
          </span>
        </div>
      </div>
    </article>
  );
}
