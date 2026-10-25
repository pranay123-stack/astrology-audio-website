import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BookOpen, CalendarClock, CalendarDays, ChevronLeft, Clock, Languages, Lock, Mail, MapPin } from "lucide-react";
import { EpisodePlayer } from "@/components/audio/EpisodePlayer";
import { AccessBadge, CategoryChip, DemoBadge, LanguageBadge } from "@/components/ui/Badges";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/lib/config";
import { formatDate, formatDateTime } from "@/lib/dates";
import { episodeHref, hasAudio, hasVideo, isLockedForVisitors, lengthLabel, premiumContactHref, toTrack } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode, type LocalizedEpisode } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import { getEpisodeBySlug, getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import type { EpisodeListing, Locale, Section } from "@/lib/types";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { ArticleBody } from "./ArticleBody";
import { CategoryIcon } from "./categoryIcons";
import { EpisodeCard } from "./EpisodeCard";
import { LearnCricketCta } from "./LearnCricketCta";
import { MatchCard } from "./MatchCard";
import { PhotoGallery } from "./PhotoGallery";
import { VideoBlock } from "./VideoBlock";
import { TeamBadge } from "./TeamBadge";

function isoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}

/** Structured data only for real episodes; sample content is not described to search engines. */
function JsonLd({ episode, lang }: { episode: LocalizedEpisode; lang: Locale }) {
  if (episode.is_demo) return null;
  const cover = imageUrl(episode.cover_image_path);
  const common = {
    "@context": "https://schema.org",
    description: episode.excerpt,
    url: `${siteConfig.url}${episodeHref(episode, lang)}`,
    inLanguage: episode.text_lang,
    datePublished: episode.published_at,
    isAccessibleForFree: !episode.is_premium,
    ...(cover ? { image: cover.startsWith("http") ? cover : `${siteConfig.url}${cover}` } : {}),
    genre: episode.category.name,
  };
  // An audio post is a podcast episode; an article-only post is an Article.
  const data = hasAudio(episode)
    ? { ...common, "@type": "PodcastEpisode", name: episode.title, timeRequired: isoDuration(episode.duration_seconds) }
    : { ...common, "@type": "Article", headline: episode.title };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Whether the post has text in `lang`'s opposite language (so a "Read in …" link makes sense). */
function hasOtherLanguage(raw: EpisodeListing, lang: Locale): boolean {
  return raw.article_lang !== lang || raw.title_alt.trim() !== "" || raw.has_article_alt;
}

export async function EpisodeDetail({ slug, section, lang }: { slug: string; section: Section; lang: Locale }) {
  const raw = await getEpisodeBySlug(slug);
  if (!raw) notFound();
  if (raw.category.section !== section) permanentRedirect(episodeHref(raw, lang));
  const episode = localizeEpisode(raw, lang);
  const t = getDict(lang);
  const other: Locale = lang === "hi" ? "en" : "hi";
  const onlyOther = episode.text_lang !== lang && (!episode.has_article || episode.article_lang !== lang);

  // Match readings relate to other matches; everything else (incl. cricket guide articles) to its category.
  const isMatchReading = !!episode.match;
  const related = await getEpisodes(
    isMatchReading
      ? { section, withMatch: true, competitionSlug: episode.match?.competition.slug, excludeId: episode.id, sort: "latest", limit: 3 }
      : { section, categorySlug: episode.category.slug, excludeId: episode.id, sort: "latest", limit: 3 },
  );
  const fallback =
    related.items.length === 0
      ? await getEpisodes({ section, withMatch: isMatchReading || undefined, excludeId: episode.id, sort: "latest", limit: 3 })
      : null;
  const isCricketGuide = section === "cricket" && !isMatchReading;
  const relatedItems = related.items.length ? related.items : (fallback?.items ?? []);

  const cover = imageUrl(episode.cover_image_path);
  const backHref = localePath(lang, section === "cricket" ? "/cricket-astrology" : "/astrology-audios");
  const match = episode.match;
  const paragraphs = episode.description.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="container-page py-10" data-testid="episode-detail">
      <JsonLd episode={episode} lang={lang} />
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-gold-soft">
        <ChevronLeft className="h-4 w-4" aria-hidden /> {section === "cricket" ? t.episode.allCricket : t.episode.allGeneral}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip>{episode.category.name}</CategoryChip>
            <AccessBadge premium={episode.is_premium} lang={lang} />
            {episode.is_demo && <DemoBadge lang={lang} />}
            <LanguageBadge textLang={episode.text_lang} lang={lang} />
          </div>
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" lang={episode.text_lang}>{episode.title}</h1>
          <p className="text-lg text-ink/80" lang={episode.text_lang}>{episode.excerpt}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden /> {t.episode.published}{" "}
              <time dateTime={episode.published_at ?? undefined}>{formatDate(episode.published_at, lang)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden /> {lengthLabel(episode, lang)}
            </span>
          </div>

          {onlyOther ? (
            <p className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink/90" data-testid="language-note">
              <Languages className="h-4 w-4 shrink-0 text-gold-soft" aria-hidden /> {t.episode.onlyIn[episode.text_lang]}
            </p>
          ) : (
            hasOtherLanguage(raw, lang) && (
              <Link
                href={episodeHref(episode, other)}
                prefetch={false} // cross-language link: see LanguageSwitch
                hrefLang={other}
                lang={other}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-soft hover:underline"
                data-testid="other-language-link"
              >
                <Languages className="h-4 w-4" aria-hidden /> {t.episode.readIn[other]}
              </Link>
            )
          )}

          {hasVideo(episode) && <VideoBlock episode={episode} locked={isLockedForVisitors(episode)} lang={lang} />}

          {hasAudio(episode) && <EpisodePlayer track={toTrack(episode, lang)} locked={isLockedForVisitors(episode)} />}

          {match && (
            <section className="card p-6" aria-labelledby="match-heading">
              <h2 id="match-heading" className="eyebrow mb-5 font-sans">
                {t.episode.matchDetails(match.competition.name)}
              </h2>
              <div className="flex items-center justify-around gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <TeamBadge team={match.team_a} size={64} />
                  <span className="font-semibold">{match.team_a.name}</span>
                </div>
                <span className="font-display text-3xl text-gold-soft italic" aria-hidden>{t.common.vs}</span>
                <div className="flex flex-col items-center gap-2 text-center">
                  <TeamBadge team={match.team_b} size={64} />
                  <span className="font-semibold">{match.team_b.name}</span>
                </div>
              </div>
              <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-gold-soft" aria-hidden />
                  <dt className="sr-only">{t.episode.startTime}</dt>
                  <dd><time dateTime={match.match_date}>{formatDateTime(match.match_date, lang)}</time></dd>
                </div>
                {match.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold-soft" aria-hidden />
                    <dt className="sr-only">{t.episode.venue}</dt>
                    <dd>{match.venue}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {episode.has_article && (
            <section aria-labelledby="article-heading" className="space-y-5" data-testid="article-section">
              <h2 id="article-heading" className="flex items-center gap-2 font-display text-3xl text-gold-soft">
                <BookOpen className="h-6 w-6" aria-hidden /> {getDict(episode.article_lang).episode.article}
              </h2>
              {episode.article ? (
                <div className="card p-6 sm:p-8">
                  <ArticleBody source={episode.article} lang={episode.article_lang} />
                </div>
              ) : (
                // Premium: the article text is never sent to visitors (database policy), so only the lock is shown.
                <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center" data-testid="locked-article">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-soft">
                    <Lock className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="flex-1 text-sm text-muted">{t.episode.lockedArticle}</p>
                  <Link href={premiumContactHref(episode.title, lang)} className="btn-gold">
                    <Mail className="h-4 w-4" aria-hidden /> {t.episode.contactPackage}
                  </Link>
                </div>
              )}
            </section>
          )}

          {episode.gallery_paths.length > 0 && <PhotoGallery paths={episode.gallery_paths} title={episode.title} titleLang={episode.text_lang} />}

          {paragraphs.length > 0 && (
            <section aria-labelledby="notes-heading" className="prose-cosmic" lang={episode.text_lang}>
              <h2 id="notes-heading" lang={lang}>{t.episode.notes}</h2>
              {paragraphs.map((para, i) => (
                <p key={i} className="whitespace-pre-line">{para}</p>
              ))}
            </section>
          )}

          {isCricketGuide && <LearnCricketCta lang={lang} />}

          {section === "cricket" && <CricketDisclaimer lang={lang} />}
        </div>

        <aside className="space-y-6">
          <div className={`card relative overflow-hidden ${cover ? "" : "aspect-square"}`}>
            {cover ? (
              // Shown at its own shape, so titled thumbnails and tall artwork are never cropped.
              <Image
                src={cover}
                alt={t.common.coverArtFor(episode.title)}
                width={1200}
                height={800}
                sizes="(min-width: 1024px) 380px, 100vw"
                className="h-auto w-full"
                priority
              />
            ) : (
              // Posts without cover art (common for articles) get a themed panel instead of an empty box.
              <div className="relative flex h-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-plum-2 via-plum to-navy p-8 text-center" data-testid="cover-fallback">
                <ZodiacWheel className="absolute inset-0 m-auto h-[85%] w-[85%] opacity-25" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-night/60 text-gold-soft">
                  <CategoryIcon slug={episode.category.slug} className="h-8 w-8" />
                </span>
                <p className="relative font-display text-3xl leading-tight text-ink" lang={episode.text_lang}>{episode.title}</p>
                <p className="relative text-xs font-semibold tracking-[0.25em] text-gold uppercase">{episode.category.name}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-20" aria-labelledby="related-heading">
          <SectionHeading
            id="related-heading"
            eyebrow={t.episode.keepExploring}
            title={isMatchReading ? t.episode.relatedCricket : isCricketGuide ? t.cricket.guideTitle : t.episode.relatedGeneral}
            href={backHref}
            linkLabel={t.common.viewAll}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((e) =>
              e.match ? <MatchCard key={e.id} episode={e} lang={lang} /> : <EpisodeCard key={e.id} episode={e} lang={lang} />,
            )}
          </div>
        </section>
      )}
    </article>
  );
}

export async function episodeMetadata(slug: string, lang: Locale) {
  const raw = await getEpisodeBySlug(slug);
  if (!raw) return { title: getDict(lang).episode.notFound };
  const episode = localizeEpisode(raw, lang);
  const cover = imageUrl(episode.cover_image_path);
  const url = episodeHref(episode, lang);
  return {
    title: episode.title,
    description: episode.excerpt,
    alternates: alternatesFor(lang, episodeHref(episode, "en")),
    // Sample content should not be indexed as if it were a real episode.
    robots: siteConfig.noIndex ? { index: false, follow: false } : episode.is_demo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article" as const,
      title: episode.title,
      description: episode.excerpt,
      url,
      publishedTime: episode.published_at ?? undefined,
      images: cover ? [{ url: cover, width: 600, height: 600, alt: episode.title }] : undefined,
    },
  };
}
