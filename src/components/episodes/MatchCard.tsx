import Link from "next/link";
import { BookOpen, CalendarClock, Clock, MapPin, Headphones } from "lucide-react";
import { AccessBadge, DemoBadge, LanguageBadge } from "@/components/ui/Badges";
import { formatDateTime } from "@/lib/dates";
import { episodeHref, hasAudio, lengthLabel } from "@/lib/episodes";
import { getDict, localizeEpisode } from "@/lib/i18n";
import type { EpisodeListing, Locale } from "@/lib/types";
import { MediaAction } from "./MediaAction";
import { TeamBadge } from "./TeamBadge";

export function MatchCard({ episode: raw, lang }: { episode: EpisodeListing; lang: Locale }) {
  const episode = localizeEpisode(raw, lang);
  const t = getDict(lang);
  const match = episode.match;
  if (!match) return null;
  const href = episodeHref(episode, lang);
  return (
    <article className="card relative flex flex-col gap-5 p-5 transition hover:shadow-[var(--shadow-glow)]" data-testid="match-card" data-episode-id={episode.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow">{match.competition.name}</span>
        <div className="flex gap-1.5">
          <AccessBadge premium={episode.is_premium} lang={lang} />
          {episode.is_demo && <DemoBadge lang={lang} />}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_a} size={56} />
          <span className="text-sm font-semibold">{match.team_a.name}</span>
        </div>
        <span className="font-display text-2xl text-gold-soft italic" aria-hidden>
          {t.common.vs}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge team={match.team_b} size={56} />
          <span className="text-sm font-semibold">{match.team_b.name}</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <time dateTime={match.match_date}>{formatDateTime(match.match_date, lang)}</time>
          <span className="text-ink/60">· {t.cricket.status[match.match_status]}</span>
        </p>
        {match.venue && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {match.venue}
          </p>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <LanguageBadge textLang={episode.text_lang} lang={lang} />
        <h3 className="mt-1 text-xl leading-snug font-semibold" lang={episode.text_lang}>
          <Link href={href} className="hover:text-gold-soft">
            {episode.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted" lang={episode.text_lang}>{episode.excerpt}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {lengthLabel(episode, lang)}
        </span>
        <div className="flex items-center gap-2">
          <Link href={href} className="btn-ghost px-4 py-2 text-xs">
            {hasAudio(episode) ? <Headphones className="h-4 w-4" aria-hidden /> : <BookOpen className="h-4 w-4" aria-hidden />}
            {hasAudio(episode) ? t.cricket.listenNow : t.cricket.read}
          </Link>
          <MediaAction episode={episode} lang={lang} label={episode.title} />
        </div>
      </div>
    </article>
  );
}
