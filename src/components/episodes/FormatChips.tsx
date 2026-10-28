import Link from "next/link";
import { BookOpen, Clapperboard, FileText, Headphones, LayoutGrid, Video } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { hasFormat } from "@/lib/data/repository";
import { toQueryString, type ListParams } from "@/lib/list-params";
import { POST_FORMATS, type EpisodeListing, type Locale, type PostFormat } from "@/lib/types";

const ICONS = { article: BookOpen, audio: Headphones, video: Video, reel: Clapperboard, pdf: FileText } as const;

/**
 * "All · Articles · Audio · Videos · Reels" filter. Only types that exist among `posts` are
 * offered (so a rarely used type such as reels appears once there is one), and only when
 * there is more than one type to choose from.
 */
export function FormatChips({
  posts,
  params,
  base,
  defaults,
  lang,
  anchor = "",
}: {
  posts: EpisodeListing[];
  params: Partial<ListParams>;
  base: string;
  defaults?: Partial<ListParams>;
  lang: Locale;
  anchor?: string;
}) {
  const t = getDict(lang).general;
  const present = POST_FORMATS.filter((f) => posts.some((e) => hasFormat(e, f)));
  if (present.length < 2 && !params.format) return null;
  const chip = (format: "" | PostFormat) => {
    const active = (params.format ?? "") === format;
    const Icon = format ? ICONS[format] : LayoutGrid;
    return (
      <Link
        key={format || "all"}
        href={`${base}${toQueryString({ ...params, format, page: 1 }, defaults)}${anchor}`}
        aria-current={active ? "page" : undefined}
        scroll={false}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
          active ? "border-gold bg-gold text-night" : "border-line bg-white/5 text-ink/80 hover:border-gold/50"
        }`}
        data-testid={`format-${format || "all"}`}
      >
        <Icon className="h-4 w-4" aria-hidden /> {t.formats[format || "all"]}
      </Link>
    );
  };
  return (
    <nav aria-label={t.formatsNav} className="flex flex-wrap items-center gap-2" data-testid="format-chips">
      {chip("")}
      {present.map((f) => chip(f))}
    </nav>
  );
}
