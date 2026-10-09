import Link from "next/link";
import { CalendarClock, Clock, MapPin, Headphones } from "lucide-react";
import { PlayButton } from "@/components/audio/PlayButton";
import { AccessBadge, DemoBadge } from "@/components/ui/Badges";
import { formatDateTime, formatDurationLabel } from "@/lib/dates";
import { episodeHref, isLockedForVisitors, toTrack } from "@/lib/episodes";
import type { EpisodeListing } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  live: "In progress",
  completed: "Completed",
  abandoned: "Abandoned",
  postponed: "Postponed",
};

export function MatchCard({ episode }: { episode: EpisodeListing }) {
  const match = episode.match;
  if (!match) return null;
  const href = episodeHref(episode);
  return (
    <article className="card relative flex flex-col gap-5 p-5 transition hover:shadow-[var(--shadow-glow)]" data-testid="match-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow">{match.competition.name}</span>
        <div className="flex gap-1.5">
          <AccessBadge premium={episode.is_premium} />
          {episode.is_demo && <DemoBadge />}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_a} size={56} />
          <span className="text-sm font-semibold">{match.team_a.name}</span>
        </div>
        <span className="font-display text-2xl text-gold-soft italic" aria-hidden>
          vs
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_b} size={56} />
          <span className="text-sm font-semibold">{match.team_b.name}</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <time dateTime={match.match_date}>{formatDateTime(match.match_date)}</time>
          <span className="text-ink/60">· {STATUS_LABEL[match.match_status]}</span>
        </p>
        {match.venue && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {match.venue}
          </p>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="text-xl leading-snug font-semibold">
          <Link href={href} className="hover:text-gold-soft">
            {episode.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{episode.excerpt}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDurationLabel(episode.duration_seconds)}
        </span>
        <div className="flex items-center gap-2">
          <Link href={href} className="btn-ghost px-4 py-2 text-xs">
            <Headphones className="h-4 w-4" aria-hidden /> Listen now
          </Link>
          <PlayButton track={toTrack(episode)} locked={isLockedForVisitors(episode)} label={episode.title} />
        </div>
      </div>
    </article>
  );
}
