import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ExternalLink, GraduationCap, Headphones, Languages, Library, Quote, Sparkles } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { MatchCard } from "@/components/episodes/MatchCard";
import { MediaAction } from "@/components/episodes/MediaAction";
import { ReelsStrip } from "@/components/episodes/ReelsStrip";
import { learnPath } from "@/components/layout/nav";
import { QuotesBand } from "@/components/layout/QuotesBand";
import { Starfield } from "@/components/layout/Starfield";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { episodeHref, lengthLabel, posterUrl } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode, localizeProfile } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import { alternatesFor } from "@/lib/seo";
import { getEpisodes, getProfile } from "@/lib/queries";
import { getLang } from "@/lib/i18n/server";
import { TOPICS } from "@/lib/topics";
import type { EpisodeListing, Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternatesFor(await getLang(), "/") };
}

/**
 * Home page, top to bottom: quotes, hero, the latest posts (one featured), cricket predictions,
 * the KP chart and the book side by side, the daily mantra, testimonials and reels when there
 * are any, and the astrologer. The menu already lists every section, so the page does not.
 */
export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const href = (path: string) => localePath(lang, path);
  const [latest, upcoming, recentCricket, guide, testimonials, all, rawProfile] = await Promise.all([
    getEpisodes({ section: "general", limit: 5, sort: "latest" }),
    getEpisodes({ section: "cricket", withMatch: true, timing: "upcoming", sort: "match_date_asc", limit: 3 }),
    getEpisodes({ section: "cricket", withMatch: true, sort: "latest", limit: 3 }),
    getEpisodes({ categorySlug: "cricket-astrology-guide", sort: "latest", limit: 3 }),
    getEpisodes({ categorySlugs: [TOPICS.testimonialAudio.categorySlug, TOPICS.testimonialMessages.categorySlug], sort: "latest", limit: 3 }),
    getEpisodes({ limit: 1 }),
    getProfile(),
  ]);
  const cricket = upcoming.items.length > 0 ? upcoming.items : recentCricket.items;
  const profile = localizeProfile(rawProfile, lang);
  const portrait = imageUrl(profile.profile_image_path);
  const amazon = profile.social_links?.amazon;
  const [featured, ...more] = latest.items;
  const heroEpisode = featured ? localizeEpisode(featured, lang) : null;
  const stats = [
    { icon: Library, text: t.home.statPosts(all.total) },
    { icon: Compass, text: t.home.statKp },
    { icon: Languages, text: t.home.statLangs },
  ];

  return (
    <>
      <QuotesBand lang={lang} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Starfield />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div className="animate-rise space-y-7">
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1 className="text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              {t.home.titleA}{" "}
              <span className="mt-3 block bg-gradient-to-r from-gold-soft to-gold bg-clip-text text-3xl leading-tight text-transparent italic sm:text-4xl lg:text-5xl">
                {t.home.titleB}
              </span>
            </h1>
            <p className="max-w-xl text-lg text-ink/80">{t.home.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={href(learnPath(t.learn.subject))} className="btn-gold px-6 py-3 text-base" data-testid="hero-learn">
                <GraduationCap className="h-5 w-5" aria-hidden /> {t.nav.learn}
              </Link>
              <Link href={href("/kp-chart")} className="btn-ghost px-6 py-3 text-base" data-testid="hero-kp">
                <Compass className="h-5 w-5" aria-hidden /> {t.menu.kpChart}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm text-ink/75" data-testid="hero-stats">
              {stats.map((s) => (
                <li key={s.text} className="inline-flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-gold-soft" aria-hidden /> {s.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            {/* The wheel of planets around a match; its square corners fade into the page. */}
            <Image
              src="/hero-cricket-astrology.webp"
              alt={t.home.heroImageAlt}
              width={1254}
              height={1254}
              priority
              sizes="(min-width: 1024px) 512px, 90vw"
              className="h-auto w-full drop-shadow-[0_0_60px_rgb(252_196_25/0.35)] [mask-image:radial-gradient(circle,black_70%,transparent_80%)]"
              data-testid="hero-image"
            />
            {heroEpisode && (
              <div
                className="relative mx-4 -mt-2 flex items-center gap-4 rounded-2xl border border-gold/30 bg-night/85 p-4 shadow-[var(--shadow-glow)] backdrop-blur-md sm:mx-10"
                data-testid="hero-latest"
              >
                <MediaAction episode={heroEpisode} lang={lang} label={heroEpisode.title} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-gold uppercase">{t.home.latestReading}</p>
                  <Link href={episodeHref(heroEpisode, lang)} lang={heroEpisode.text_lang} className="line-clamp-1 text-sm font-semibold hover:text-gold-soft">
                    {heroEpisode.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {heroEpisode.category.name} · {lengthLabel(heroEpisode, lang)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest: one featured post, the next ones listed beside it */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow={t.home.latestEyebrow}
          title={t.home.latestTitle}
          description={t.home.latestDesc}
          href={href("/astrology")}
          linkLabel={t.home.browseAll}
        />
        {featured ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <EpisodeCard episode={featured} lang={lang} priority />
            {more.length > 0 && (
              <div className="card flex flex-col p-5" data-testid="home-more-latest">
                <p className="eyebrow mb-3">{t.home.moreLatest}</p>
                <ul className="divide-y divide-line">
                  {more.map((e) => (
                    <li key={e.id}>
                      <CompactPost episode={e} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title={t.home.noEpisodes}>{t.home.noEpisodesBody}</EmptyState>
        )}
      </section>

      {/* Cricket predictions: match readings when there are any, otherwise the guide */}
      <section className="relative py-16" aria-labelledby="cricket-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-plum/30 to-transparent" />
        <div className="container-page">
          <SectionHeading
            id="cricket-heading"
            eyebrow={t.home.cricketEyebrow}
            title={t.home.cricketTitle}
            description={upcoming.items.length ? t.home.cricketUpcoming : recentCricket.items.length ? t.home.cricketRecent : t.home.cricketGuide}
            href={href(cricket.length ? "/horoscope-research/matches" : "/astrology/kp-research")}
            linkLabel={cricket.length ? t.home.allMatchReadings : t.home.seeAll}
          />
          {cricket.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cricket.map((e) => (
                <MatchCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
          ) : guide.items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="home-cricket-guide">
              {guide.items.map((e) => (
                <EpisodeCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
          ) : (
            <EmptyState title={t.home.matchSoon}>{t.home.matchSoonBody}</EmptyState>
          )}
          <CricketDisclaimer lang={lang} className="mt-8" />
        </div>
      </section>

      {/* Spotlights: the free KP chart and the book */}
      <section className="container-page grid gap-6 py-16 lg:grid-cols-2">
        <div className="card relative flex flex-col gap-5 overflow-hidden p-8" data-testid="kp-promo">
          <ZodiacWheel className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 opacity-15" />
          <p className="eyebrow relative flex items-center gap-2">
            <Compass className="h-4 w-4" aria-hidden /> {t.home.kpEyebrow}
          </p>
          <h2 id="kp-promo-heading" className="relative text-3xl font-semibold sm:text-4xl">{t.home.kpTitle}</h2>
          <p className="relative text-ink/80">{t.home.kpBody}</p>
          <Link href={href("/kp-chart")} className="btn-gold relative mt-auto self-start px-6 py-3 text-base">
            <Sparkles className="h-5 w-5" aria-hidden /> {t.home.kpCta}
          </Link>
        </div>
        <div className="card relative flex flex-col gap-5 overflow-hidden p-8 sm:flex-row sm:items-start" data-testid="home-book">
          {/* A drawn book cover: no cover image is available. */}
          <div className="flex h-44 w-32 shrink-0 flex-col justify-between rounded-r-lg rounded-l-sm border-l-4 border-gold bg-gradient-to-br from-plum-2 to-night p-3 shadow-[var(--shadow-glow)]">
            <BookOpen className="h-5 w-5 text-gold-soft" aria-hidden />
            <p lang="en" className="font-display text-sm leading-tight text-gold-soft">{t.home.bookTitle}</p>
            <p className="text-[9px] tracking-wide text-ink/70 uppercase">{profile.display_name}</p>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <p className="eyebrow">{t.home.bookEyebrow}</p>
            <h2 lang="en" className="text-3xl font-semibold">“{t.home.bookTitle}”</h2>
            <p className="text-ink/80">{t.home.bookBody}</p>
            <div className="mt-auto flex flex-wrap gap-3">
              <Link href={href("/book")} className="btn-gold">
                <Headphones className="h-4 w-4" aria-hidden /> {t.home.bookListen}
              </Link>
              {amazon && (
                <a href={amazon} target="_blank" rel="noopener noreferrer" className="btn-ghost" data-testid="book-buy">
                  <ExternalLink className="h-4 w-4" aria-hidden /> {t.home.bookCta}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The daily mantra from the Shani rules */}
      <section className="relative isolate overflow-hidden border-y border-line py-16" aria-labelledby="mantra-heading" data-testid="home-mantra">
        <Starfield />
        <div className="container-page relative mx-auto max-w-3xl space-y-5 text-center">
          <p id="mantra-heading" className="eyebrow">{t.home.mantraEyebrow}</p>
          <Quote className="mx-auto h-8 w-8 text-gold-soft" aria-hidden />
          <p lang="en" className="font-display text-4xl leading-tight text-ink italic sm:text-5xl">“{t.home.mantra}”</p>
          <Link href={href("/rules")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-soft hover:underline">
            {t.home.mantraLink} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {testimonials.items.length > 0 && (
        <section className="container-page py-16" aria-labelledby="testimonials-heading">
          <SectionHeading
            id="testimonials-heading"
            eyebrow={t.home.testimonialsEyebrow}
            title={t.home.testimonialsTitle}
            href={href("/testimonials")}
            linkLabel={t.home.seeAll}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.items.map((e) => (
              <EpisodeCard key={e.id} episode={e} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <ReelsStrip lang={lang} />

      {/* About the astrologer: last section before the footer */}
      <section className="container-page py-16" aria-labelledby="about-heading">
        <div className="card grid overflow-hidden md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="relative aspect-square bg-plum md:aspect-auto">
            {portrait && <Image src={portrait} alt={t.common.portraitOf(profile.display_name)} fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" />}
          </div>
          <div className="space-y-4 p-8 sm:p-10">
            <p className="eyebrow">{t.home.aboutEyebrow}</p>
            <h2 id="about-heading" className="text-4xl font-semibold">
              {profile.display_name}
            </h2>
            <p className="text-ink/85">{profile.biography}</p>
            {profile.specializations.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t.home.specialisations}>
                {profile.specializations.map((s) => (
                  <li key={s} className="chip border border-line bg-white/5 py-1 text-ink/80 normal-case">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={href(learnPath(t.learn.subject))} className="btn-gold">
                <GraduationCap className="h-4 w-4" aria-hidden /> {t.nav.learn}
              </Link>
              <Link href={href("/about")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-soft">
                {t.home.readMore} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** One line of the "more new posts" list: small cover, title and what it contains. */
function CompactPost({ episode: raw, lang }: { episode: EpisodeListing; lang: Locale }) {
  const e = localizeEpisode(raw, lang);
  const cover = posterUrl(e);
  return (
    <Link href={episodeHref(e, lang)} className="group flex items-center gap-4 py-3">
      <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-plum">
        {cover && <Image src={cover} alt="" fill sizes="96px" className="object-cover transition group-hover:scale-105" />}
      </span>
      <span className="min-w-0">
        <span lang={e.text_lang} className="line-clamp-2 font-semibold leading-snug group-hover:text-gold-soft">
          {e.title}
        </span>
        <span className="mt-1 block text-xs text-muted">
          {e.category.name} · {lengthLabel(e, lang)}
        </span>
      </span>
    </Link>
  );
}
