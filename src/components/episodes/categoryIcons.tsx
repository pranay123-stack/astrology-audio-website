import { BookOpen, CalendarDays, Flower2, Moon, Orbit, Sparkles, Star, Trophy, type LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "cricket-astrology": Trophy,
  "daily-astrology": CalendarDays,
  "horoscope-insights": Star,
  "planetary-transits": Orbit,
  "zodiac-sign-guidance": Sparkles,
  "vedic-astrology": Moon,
  "spirituality-and-meditation": Flower2,
  "astrology-learning": BookOpen,
};

export function CategoryIcon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  const Icon = CATEGORY_ICONS[slug] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
