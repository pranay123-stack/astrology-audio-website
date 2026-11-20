import Image from "next/image";
import Link from "next/link";
import { Radio } from "lucide-react";
import { TeamBadge } from "@/components/episodes/TeamBadge";
import { formatDate } from "@/lib/dates";
import { episodeHref } from "@/lib/episodes";
import { getDict, localizeEpisode } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import type { EpisodeListing, Locale, TeamSummary } from "@/lib/types";

const SIGNS = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];
/** The seven grahas on the orbit: glyph, colour, angle (degrees) and size. */
const PLANETS = [
  { g: "☉", c: "#fbbf24", a: 0, r: 15 },
  { g: "☽", c: "#e5e7eb", a: 52, r: 12 },
  { g: "♂", c: "#ef4444", a: 103, r: 11 },
  { g: "☿", c: "#a3a3a3", a: 155, r: 10 },
  { g: "♃", c: "#f59e0b", a: 206, r: 14 },
  { g: "♀", c: "#fde68a", a: 257, r: 11 },
  { g: "♄", c: "#d6b56d", a: 308, r: 13 },
];
const FONT =
  "'Segoe UI Symbol','Apple Symbols','DejaVu Sans','Noto Sans Symbols',sans-serif";

/**
 * The hero's picture when a match reading exists: the latest match on a turning zodiac wheel.
 * The sign ring turns one way and the planets orbit the other; in the centre the two teams face
 * each other (captain's photo with the team logo, or the logo alone), with a spinning ball between
 * them. The whole stage links to the reading. Motion stops for visitors who ask for less motion.
 */
export function HeroMatchStage({
  episode: raw,
  lang,
}: {
  episode: EpisodeListing;
  lang: Locale;
}) {
  const e = localizeEpisode(raw, lang);
  const t = getDict(lang);
  const m = e.match!;
  return (
    <Link
      href={episodeHref(e, lang)}
      className="group relative mx-auto block aspect-square w-full max-w-[34rem] animate-rise"
      aria-label={`${t.home.latestMatch}: ${m.team_a.name} ${t.common.vs} ${m.team_b.name}`}
      data-testid="hero-latest"
    >
      {/* Glow behind the wheel, and each team's colour on its side. */}
      <span
        className="stage-pulse absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgb(252_196_25/0.35),rgb(220_38_38/0.2)_45%,transparent_70%)]"
        aria-hidden
      />
      <span
        className="absolute top-[30%] left-[4%] h-[40%] w-[34%] rounded-full opacity-40 blur-3xl"
        style={{ background: m.team_a.primary_color }}
        aria-hidden
      />
      <span
        className="absolute top-[30%] right-[4%] h-[40%] w-[34%] rounded-full opacity-40 blur-3xl"
        style={{ background: m.team_b.primary_color }}
        aria-hidden
      />

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="stage-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe7a1" />
            <stop offset="1" stopColor="#b8891a" />
          </linearGradient>
        </defs>
        {/* The sign ring, turning slowly. */}
        <g className="stage-spin" style={{ transformOrigin: "200px 200px" }}>
          <circle
            cx="200"
            cy="200"
            r="194"
            fill="none"
            stroke="url(#stage-gold)"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="200"
            r="160"
            fill="none"
            stroke="url(#stage-gold)"
            strokeWidth="1"
            strokeOpacity=".7"
          />
          {SIGNS.map((sign, i) => {
            const a = (i * Math.PI) / 6 - Math.PI / 2;
            const mid = a + Math.PI / 12;
            return (
              <g key={sign}>
                <line
                  x1={200 + Math.cos(a) * 160}
                  y1={200 + Math.sin(a) * 160}
                  x2={200 + Math.cos(a) * 194}
                  y2={200 + Math.sin(a) * 194}
                  stroke="#f3d27a"
                  strokeOpacity=".55"
                />
                <text
                  x={200 + Math.cos(mid) * 177}
                  y={200 + Math.sin(mid) * 177}
                  fill="#f3d27a"
                  fontSize="19"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={FONT}
                >
                  {sign + "︎"}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i * Math.PI) / 36;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 154}
                y1={200 + Math.sin(a) * 154}
                x2={200 + Math.cos(a) * (i % 6 === 0 ? 146 : 150)}
                y2={200 + Math.sin(a) * (i % 6 === 0 ? 146 : 150)}
                stroke="#f3d27a"
                strokeOpacity=".45"
              />
            );
          })}
        </g>
        {/* A comet running round the inside of the ring. */}
        <circle
          cx="200"
          cy="200"
          r="139"
          fill="none"
          stroke="#ffe066"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="40 834"
          className="stage-comet"
        />
        {/* The planets, orbiting the other way. */}
        <g
          className="stage-spin-rev"
          style={{ transformOrigin: "200px 200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="128"
            fill="none"
            stroke="#f3d27a"
            strokeOpacity=".25"
            strokeDasharray="2 6"
          />
          {PLANETS.map((p) => {
            const a = (p.a * Math.PI) / 180;
            const x = 200 + Math.cos(a) * 128;
            const y = 200 + Math.sin(a) * 128;
            return (
              <g key={p.g}>
                <circle cx={x} cy={y} r={p.r + 6} fill={p.c} opacity=".18" />
                <circle
                  cx={x}
                  cy={y}
                  r={p.r}
                  fill="#2a0505"
                  stroke={p.c}
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={y + 0.5}
                  fill={p.c}
                  fontSize={p.r * 1.15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={FONT}
                >
                  {p.g + "︎"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* The match, in the centre of the wheel. */}
      <span className="absolute inset-[19%] flex flex-col items-center justify-center gap-1.5 rounded-full border-2 border-gold/60 bg-night/90 px-[6%] text-center shadow-[0_0_50px_-5px_rgb(252_196_25/0.55),inset_0_0_30px_rgb(0_0_0/0.6)] transition group-hover:border-gold sm:gap-2.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.18em] text-gold uppercase sm:text-[11px]">
          <Radio
            className="h-3 w-3 animate-pulse sm:h-3.5 sm:w-3.5"
            aria-hidden
          />{" "}
          {t.home.latestMatch}
        </span>
        <span className="flex w-full items-start justify-center gap-1 sm:gap-2">
          <Side team={m.team_a} />
          <span className="flex shrink-0 flex-col items-center gap-0.5 pt-2 sm:pt-4">
            <CricketBall />
            <span className="font-display text-lg leading-none text-gold-soft italic sm:text-2xl">
              {t.common.vs}
            </span>
          </span>
          <Side team={m.team_b} />
        </span>
        <span className="text-[9px] font-semibold tracking-wide text-ink/75 uppercase sm:text-xs">
          {m.competition.short_name || m.competition.name} ·{" "}
          {formatDate(m.match_date, lang)}
        </span>
      </span>
    </Link>
  );
}

/** One team: captain's photo with the team logo on its corner, or the logo alone; then names. */
function Side({ team }: { team: TeamSummary }) {
  const photo = imageUrl(team.captain_photo_path);
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
      {photo ? (
        <span className="relative">
          <span
            className="relative block h-12 w-12 overflow-hidden rounded-full border-2 shadow-[0_0_20px_-4px_rgb(252_196_25/0.6)] sm:h-20 sm:w-20"
            style={{ borderColor: team.primary_color }}
          >
            <Image
              src={photo}
              alt={team.captain_name ?? team.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </span>
          <span className="absolute -right-2 -bottom-1 sm:-right-3">
            <TeamBadge team={team} size={26} />
          </span>
        </span>
      ) : (
        <span className="block sm:hidden">
          <TeamBadge team={team} size={46} />
        </span>
      )}
      {!photo && (
        <span className="hidden sm:block">
          <TeamBadge team={team} size={72} />
        </span>
      )}
      <span className="max-w-full truncate text-xs font-bold text-ink sm:text-base">
        {team.short_name || team.name}
      </span>
      {team.captain_name && (
        <span className="line-clamp-2 max-w-full text-[9px] leading-tight break-words text-muted sm:text-xs">
          {team.captain_name}
        </span>
      )}
    </span>
  );
}

/** A small cricket ball that spins between the teams. */
function CricketBall() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="stage-ball h-7 w-7 drop-shadow-[0_0_8px_rgb(239_68_68/0.8)] sm:h-10 sm:w-10"
      aria-hidden
    >
      <defs>
        <radialGradient id="stage-ball" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#e2554a" />
          <stop offset=".6" stopColor="#a3201c" />
          <stop offset="1" stopColor="#5a0d0d" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#stage-ball)" />
      <path
        d="M15 3 C9 14 9 26 15 37 M25 3 C31 14 31 26 25 37"
        fill="none"
        stroke="#fbe7a1"
        strokeWidth="1.3"
        strokeDasharray="2 2"
      />
      <circle cx="13" cy="12" r="4" fill="#fff" opacity=".15" />
    </svg>
  );
}
