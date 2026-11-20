import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Quote } from "lucide-react";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CategoryChip } from "@/components/ui/Badges";
import { formatDate } from "@/lib/dates";
import { episodeHref } from "@/lib/episodes";
import { getDict, localizeEpisode } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import type { EpisodeListing, Locale } from "@/lib/types";

/** Each card's phone leans a little differently, so a row of them looks hand-placed. */
const TILTS = ["-rotate-[5deg]", "rotate-[4deg]", "-rotate-[3deg]"];

/**
 * A testimonial on the home page: the message screenshot itself (the post's first photo), framed
 * as a phone held up against a glowing zodiac wheel, then the words in a quote. A post without a
 * photo shows its words as a chat bubble on the phone instead.
 */
export function TestimonialCard({ episode: raw, lang, index }: { episode: EpisodeListing; lang: Locale; index: number }) {
  const e = localizeEpisode(raw, lang);
  const href = episodeHref(e, lang);
  const shot = imageUrl(e.gallery_paths[0] ?? e.cover_image_path);
  const t = getDict(lang);
  return (
    <article className="card group relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--shadow-glow)]" data-testid="testimonial-card">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[5/4] overflow-hidden bg-[radial-gradient(circle_at_50%_70%,rgb(252_196_25/0.35),rgb(185_28_28/0.35)_40%,rgb(20_4_4/0.9)_75%)]">
        {/* The wheel turning slowly behind the phone, with a soft pulse of light. */}
        <span className="stage-spin absolute top-1/2 left-1/2 block h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-25">
          <ZodiacWheel className="h-full w-full" />
        </span>
        <span className="stage-pulse absolute top-[30%] left-1/2 h-[70%] w-[70%] -translate-x-1/2 rounded-full bg-gold/25 blur-3xl" />
        {/* Sparkles. */}
        {[
          "top-[14%] left-[12%] h-1.5 w-1.5",
          "top-[22%] right-[14%] h-1 w-1",
          "top-[58%] left-[8%] h-1 w-1",
          "top-[48%] right-[9%] h-1.5 w-1.5",
        ].map((pos, i) => (
          <span key={pos} className={`absolute ${pos} animate-pulse rounded-full bg-gold-soft shadow-[0_0_8px_2px_rgb(252_196_25/0.7)]`} style={{ animationDelay: `${i * 0.6}s` }} />
        ))}

        {/* The phone, rising from the bottom edge. */}
        <span
          className={`absolute top-[12%] left-1/2 block aspect-[9/17] w-[46%] -translate-x-1/2 ${TILTS[index % TILTS.length]} rounded-[1.6rem] border-[5px] border-[#140303] bg-[#140303] shadow-[0_20px_50px_-10px_rgb(0_0_0/0.8),0_0_0_1px_rgb(252_196_25/0.55),0_0_35px_-5px_rgb(252_196_25/0.6)] transition duration-500 group-hover:-translate-y-2 group-hover:rotate-0`}
        >
          <span className="absolute top-1 left-1/2 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[#140303]" />
          <span className="relative block h-full w-full overflow-hidden rounded-[1.25rem] bg-[#ece5dd]">
            {shot ? (
              <Image src={shot} alt="" fill sizes="(min-width: 1024px) 15vw, (min-width: 640px) 25vw, 45vw" className="object-cover object-top" />
            ) : (
              <span className="flex h-full flex-col justify-center p-2">
                <span className="rounded-lg rounded-tl-none bg-white p-2 text-[10px] leading-snug text-[#111] shadow" lang={e.text_lang}>
                  {e.excerpt || e.title}
                </span>
              </span>
            )}
          </span>
        </span>

        {/* A big gold quote mark on the corner. */}
        <span className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-night/80 text-gold shadow-[0_0_18px_-2px_rgb(252_196_25/0.7)]">
          <Quote className="h-5 w-5 fill-gold" aria-hidden />
        </span>
        <span className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-night/90 to-transparent" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <CategoryChip>{e.category.name}</CategoryChip>
        </div>
        <h3 className="text-2xl leading-tight font-semibold" lang={e.text_lang}>
          <Link href={href} className="hover:text-gold-soft">
            {e.title}
          </Link>
        </h3>
        {e.excerpt && (
          <p className="border-l-2 border-gold/60 pl-3 text-sm text-ink/80 italic" lang={e.text_lang}>
            “{e.excerpt.trim().replace(/^["'“‘]+|["'”’]+$/g, "").trim()}”
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> <time dateTime={e.published_at ?? undefined}>{formatDate(e.published_at, lang)}</time>
          </span>
          <Link href={href} className="inline-flex items-center gap-1 font-semibold text-gold-soft hover:underline">
            {t.home.readMore} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
