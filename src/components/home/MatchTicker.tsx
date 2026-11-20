import Link from "next/link";
import { Radio } from "lucide-react";
import { TeamBadge } from "@/components/episodes/TeamBadge";
import { formatDate } from "@/lib/dates";
import { episodeHref } from "@/lib/episodes";
import { getDict, localizeEpisode } from "@/lib/i18n";
import type { EpisodeListing, Locale } from "@/lib/types";

/**
 * A scoreboard strip of recent match readings that slides past slowly (it stops on hover, and stands
 * still for visitors who ask for less motion, who can scroll it instead). The list is drawn twice so
 * the slide loops without a jump; the copy is hidden from screen readers and keyboard focus.
 */
export function MatchTicker({ episodes, lang }: { episodes: EpisodeListing[]; lang: Locale }) {
  const d = getDict(lang);
  const t = d.home;
  const items = episodes.filter((e) => e.match);
  if (items.length < 2) return null;
  const list = (copy: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy || undefined}>
      {items.map((raw) => {
        const e = localizeEpisode(raw, lang);
        const m = e.match!;
        return (
          <li key={e.id} className="flex items-center">
            <Link
              href={episodeHref(e, lang)}
              tabIndex={copy ? -1 : undefined}
              className="group flex items-center gap-2.5 px-5 py-2.5 text-sm whitespace-nowrap hover:bg-white/5"
            >
              <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold uppercase">{m.competition.short_name || m.competition.name}</span>
              <TeamBadge team={m.team_a} size={24} />
              <span className="font-semibold text-ink group-hover:text-gold-soft">{m.team_a.short_name || m.team_a.name}</span>
              <span className="font-display text-gold-soft italic">{d.common.vs}</span>
              <span className="font-semibold text-ink group-hover:text-gold-soft">{m.team_b.short_name || m.team_b.name}</span>
              <TeamBadge team={m.team_b} size={24} />
              <span className="text-xs text-muted">{formatDate(m.match_date, lang)}</span>
            </Link>
            <span className="h-1.5 w-1.5 rounded-full bg-gold/50" aria-hidden />
          </li>
        );
      })}
    </ul>
  );
  return (
    <section aria-label={t.tickerLabel} className="relative border-y border-gold/30 bg-black/35" data-testid="match-ticker">
      <div className="flex items-stretch">
        <p className="relative z-10 flex shrink-0 items-center gap-2 bg-gradient-to-r from-plum-2 to-plum px-4 text-xs font-bold tracking-wider text-gold-soft uppercase shadow-[8px_0_20px_-6px_rgb(0_0_0/0.6)]">
          <Radio className="h-4 w-4 animate-pulse" aria-hidden />
          <span className="hidden sm:inline">{t.tickerLabel}</span>
        </p>
        <div className="ticker-mask min-w-0 flex-1 overflow-x-auto motion-safe:overflow-hidden">
          <div className="ticker-track flex w-max">
            {list(false)}
            {list(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
