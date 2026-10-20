import { BookOpen, FlaskConical, Headphones, Languages, Lock, Sparkles } from "lucide-react";
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

/** Shows whether a post has audio, an article, or both. */
export function FormatBadges({ audio, article, lang }: { audio: boolean; article: boolean; lang: Locale }) {
  const t = getDict(lang).badges;
  return (
    <>
      {audio && (
        <span className="chip border border-line bg-white/5 text-ink/80">
          <Headphones className="h-3 w-3" aria-hidden /> {t.audio}
        </span>
      )}
      {article && (
        <span className="chip border border-line bg-white/5 text-ink/80" data-testid="article-badge">
          <BookOpen className="h-3 w-3" aria-hidden /> {t.article}
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
