import { BookOpen, FlaskConical, Headphones, Lock, Sparkles } from "lucide-react";

export function AccessBadge({ premium }: { premium: boolean }) {
  return premium ? (
    <span className="chip border border-gold/50 bg-gold/15 text-gold-soft">
      <Lock className="h-3 w-3" aria-hidden /> Premium
    </span>
  ) : (
    <span className="chip border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
      <Sparkles className="h-3 w-3" aria-hidden /> Free
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="chip border border-sky-300/40 bg-sky-400/10 text-sky-200" title="Demonstration content, not a real episode">
      <FlaskConical className="h-3 w-3" aria-hidden /> Sample
    </span>
  );
}

/** Shows whether a post has audio, an article, or both. */
export function FormatBadges({ audio, article }: { audio: boolean; article: boolean }) {
  return (
    <>
      {audio && (
        <span className="chip border border-line bg-white/5 text-ink/80">
          <Headphones className="h-3 w-3" aria-hidden /> Audio
        </span>
      )}
      {article && (
        <span className="chip border border-line bg-white/5 text-ink/80" data-testid="article-badge">
          <BookOpen className="h-3 w-3" aria-hidden /> Article
        </span>
      )}
    </>
  );
}

export function CategoryChip({ children }: { children: React.ReactNode }) {
  return <span className="chip border border-line bg-white/5 text-muted">{children}</span>;
}
