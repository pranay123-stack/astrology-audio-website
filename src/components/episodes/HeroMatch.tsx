import Link from "next/link";
import { CalendarClock, Headphones, MapPin } from "lucide-react";
import { AccessBadge, DemoBadge } from "@/components/ui/Badges";
import { formatDateTime } from "@/lib/dates";
import { episodeHref, hasAudio, lengthLabel } from "@/lib/episodes";
import type { EpisodeListing } from "@/lib/types";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { Countdown } from "./Countdown";
import { MediaAction } from "./MediaAction";
import { TeamBadge } from "./TeamBadge";

/** The featured match prediction shown in the homepage hero. */
export function HeroMatch({ episode, upcoming }: { episode: EpisodeListing; upcoming: boolean }) {
  const match = episode.match!;
  const href = episodeHref(episode);
  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-plum/90 via-navy/95 to-night/95 p-6 shadow-[0_30px_80px_-30px_rgb(220_38_38/0.7)] backdrop-blur-md sm:p-7"
      data-testid="hero-match"
    >
      {/* Pitch stripe */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 bg-gradient-to-b from-transparent via-emerald-300/[0.06] to-transparent" aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <span className="chip border border-gold/50 bg-gold/10 text-gold-soft">
          {upcoming ? "Next match prediction" : "Latest match prediction"}
        </span>
        <div className="flex gap-1.5">
          <AccessBadge premium={episode.is_premium} />
          {episode.is_demo && <DemoBadge />}
        </div>
      </div>

      <p className="relative mt-5 text-center text-xs font-semibold tracking-[0.3em] text-muted uppercase">{match.competition.name}</p>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_a} size={68} />
          <span className="text-sm font-semibold sm:text-base">{match.team_a.name}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center" aria-hidden>
          <ZodiacWheel center="ball" className="h-24 w-24 sm:h-28 sm:w-28" />
          <span className="-mt-1 font-display text-2xl text-gold-soft italic">vs</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_b} size={68} />
          <span className="text-sm font-semibold sm:text-base">{match.team_b.name}</span>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col items-center gap-3">
        {upcoming && <Countdown to={match.match_date} />}
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={match.match_date}>{formatDateTime(match.match_date)}</time>
          </span>
          {match.venue && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {match.venue}
            </span>
          )}
        </p>
      </div>

      <div className="relative mt-6 flex items-center gap-4 rounded-2xl border border-line bg-night/50 p-4">
        <MediaAction episode={episode} size="lg" label={episode.title} />
        <div className="min-w-0 flex-1">
          <Link href={href} className="line-clamp-2 text-sm leading-snug font-semibold hover:text-gold-soft">
            {episode.title}
          </Link>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
            <Headphones className="h-3.5 w-3.5" aria-hidden /> {hasAudio(episode) ? "Audio reading" : "Article"} · {lengthLabel(episode)}
          </p>
        </div>
      </div>
    </article>
  );
}
