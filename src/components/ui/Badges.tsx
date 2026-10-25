import { BookOpen, Clapperboard, FlaskConical, Headphones, Images, Languages, Lock, Sparkles, Video } from "lucide-react";
import type { VideoFormat } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function AccessBadge({ premium, lang }: { premium: boolean; lang: Locale }) {
  const t = getDict(lang).badges;
  return premium ? (
    <span className="chip border border-gold/50 bg-gold/15 text-gold-soft">
      <Lock className="h-3 w-3" aria-hidden /> {t.premium}
    </span>
  ) : (
    <span className="chip border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
      <Sparkles className="h-3 w-3" aria-hidden /> {t.free}
    </span>
  );
}

export function DemoBadge({ lang }: { lang: Locale }) {
  const t = getDict(lang).badges;
  return (
    <span className="chip border border-sky-300/40 bg-sky-400/10 text-sky-200" title={t.sampleTitle}>
      <FlaskConical className="h-3 w-3" aria-hidden /> {t.sample}
    </span>
  );
}

/** Shows what a post contains: audio, video or reel, article, photos. */
export function FormatBadges({
  audio,
  article,
  video = null,
  photos = false,
  lang,
}: {
  audio: boolean;
  article: boolean;
  /** The video's format, or null when the post has no video. */
  video?: VideoFormat | null;
  photos?: boolean;
  lang: Locale;
}) {
  const t = getDict(lang).badges;
  return (
    <>
      {audio && (
        <span className="chip border border-line bg-white/5 text-ink/80">
          <Headphones className="h-3 w-3" aria-hidden /> {t.audio}
        </span>
      )}
      {video && (
        <span className="chip border border-line bg-white/5 text-ink/80" data-testid="video-badge">
          {video === "reel" ? <Clapperboard className="h-3 w-3" aria-hidden /> : <Video className="h-3 w-3" aria-hidden />}{" "}
          {video === "reel" ? t.reel : t.video}
        </span>
      )}
      {article && (
        <span className="chip border border-line bg-white/5 text-ink/80" data-testid="article-badge">
          <BookOpen className="h-3 w-3" aria-hidden /> {t.article}
        </span>
      )}
      {photos && (
        <span className="chip border border-line bg-white/5 text-ink/80" data-testid="photos-badge">
          <Images className="h-3 w-3" aria-hidden /> {t.photos}
        </span>
      )}
    </>
  );
}

/** "In Hindi" / "अंग्रेज़ी में": shown when a post's text is not in the page language. */
export function LanguageBadge({ textLang, lang }: { textLang: Locale; lang: Locale }) {
  if (textLang === lang) return null;
  return (
    <span className="chip border border-gold/40 bg-gold/10 text-gold-soft normal-case" data-testid="language-badge">
      <Languages className="h-3 w-3" aria-hidden /> {getDict(lang).badges.inLanguage[textLang]}
    </span>
  );
}

export function CategoryChip({ children }: { children: React.ReactNode }) {
  return <span className="chip border border-line bg-white/5 text-muted">{children}</span>;
}
