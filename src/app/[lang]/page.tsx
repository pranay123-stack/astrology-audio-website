import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, GraduationCap, Orbit, ScrollText, Sparkles, Telescope } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { LearnCricketCta } from "@/components/episodes/LearnCricketCta";
import { MatchCard } from "@/components/episodes/MatchCard";
import { MediaAction } from "@/components/episodes/MediaAction";
import { ReelsStrip } from "@/components/episodes/ReelsStrip";
import { BookCard } from "@/components/layout/BookCard";
import { KpPromo } from "@/components/layout/KpPromo";
import { learnPath } from "@/components/layout/nav";
import { QuotesBand } from "@/components/layout/QuotesBand";
import { Starfield } from "@/components/layout/Starfield";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { ExploreMenu } from "@/components/topics/ExploreMenu";
import { episodeHref, lengthLabel } from "@/lib/episodes";
import { getDict, localePath, localizeEpisode, localizeProfile } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import { alternatesFor } from "@/lib/seo";
import { getEpisodes, getProfile } from "@/lib/queries";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternatesFor(await getLang(), "/") };
}

export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const href = (path: string) => localePath(lang, path);
  const [latestGeneral, upcoming, recentCricket, guide, rawProfile] = await Promise.all([
    getEpisodes({ section: "general", limit: 3, sort: "latest" }),
    getEpisodes({ section: "cricket", withMatch: true, timing: "upcoming", sort: "match_date_asc", limit: 3 }),
    getEpisodes({ section: "cricket", withMatch: true, sort: "latest", limit: 3 }),
    getEpisodes({ categorySlug: "cricket-astrology-guide", sort: "latest", limit: 3 }),
    getProfile(),
  ]);
  const cricket = upcoming.items.length > 0 ? upcoming.items : recentCricket.items;
  // Shortcuts under the hero to the menu's main pages.
  const shortcuts = [
    { key: "planetsBhav", path: "/astrology/planets-bhav", icon: Orbit },
    { key: "kpResearch", path: "/astrology/kp-research", icon: Telescope },
    { key: "podcast", path: "/astro-cricket/videos", icon: Clapperboard },
    { key: "book", path: "/book", icon: BookOpen },
    { key: "research", path: "/horoscope-research", icon: ScrollText },
  ] as const;
  const profile = localizeProfile(rawProfile, lang);
  const portrait = imageUrl(profile.profile_image_path);
  const heroEpisode = latestGeneral.items[0] ? localizeEpisode(latestGeneral.items[0], lang) : null;

  return (
    <>
      <QuotesBand lang={lang} />
      {/* Hero: general astrology first; cricket readings are further down the page */}
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
              <Link href={href("/astrology")} className="btn-ghost px-6 py-3 text-base">
                <Sparkles className="h-5 w-5" aria-hidden /> {t.home.listen}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label={t.home.popularCategories}>
              {shortcuts.map((c) => (
                <li key={c.key}>
                  <Link
                    href={href(c.path)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 px-3 py-1.5 text-sm text-ink/80 hover:border-gold/50 hover:text-gold-soft"
                  >
                    <c.icon className="h-4 w-4" aria-hidden /> {t.menu[c.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <ZodiacWheel className="w-full drop-shadow-[0_0_60px_rgb(252_196_25/0.35)]" />
            {heroEpisode && (
              <div
                className="absolute inset-x-4 -bottom-6 flex items-center gap-4 rounded-2xl border border-gold/30 bg-night/85 p-4 shadow-[var(--shadow-glow)] backdrop-blur-md sm:inset-x-10"
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

      <ExploreMenu lang={lang} youtube={profile.social_links?.youtube || undefined} />

      {/* Latest general posts */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow={t.home.latestEyebrow}
          title={t.home.latestTitle}
          description={t.home.latestDesc}
          href={href("/astrology")}
          linkLabel={t.home.browseAll}
        />
        {latestGeneral.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestGeneral.items.map((e, i) => (
              <EpisodeCard key={e.id} episode={e} lang={lang} priority={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState title={t.home.noEpisodes}>{t.home.noEpisodesBody}</EmptyState>
        )}
      </section>

      {/* Cricket astrology: match readings when there are any, and the guide articles */}
      <section className="relative py-16" aria-labelledby="cricket-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-plum/30 to-transparent" />
        <div className="container-page">
          <SectionHeading
            id="cricket-heading"
            eyebrow={t.home.cricketEyebrow}
            title={t.home.cricketTitle}
            description={upcoming.items.length ? t.home.cricketUpcoming : recentCricket.items.length ? t.home.cricketRecent : t.home.cricketGuide}
            href={href("/horoscope-research/matches")}
            linkLabel={t.home.allMatchReadings}
          />
          {cricket.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cricket.map((e) => (
                <MatchCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
          )}
          {guide.items.length > 0 && (
            <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${cricket.length ? "mt-8" : ""}`} data-testid="home-cricket-guide">
              {guide.items.map((e) => (
                <EpisodeCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
          )}
          {cricket.length === 0 && guide.items.length === 0 && <EmptyState title={t.home.matchSoon}>{t.home.matchSoonBody}</EmptyState>}
          <CricketDisclaimer lang={lang} className="mt-8" />
        </div>
      </section>

      <KpPromo lang={lang} />

      <ReelsStrip lang={lang} />

      <section className="container-page py-8">
        <LearnCricketCta lang={lang} />
      </section>

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
            <Link href={href("/about")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-soft">
              {t.home.readMore} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <BookCard amazonUrl={profile.social_links?.amazon} lang={lang} />
          </div>
        </div>
      </section>

    </>
  );
}
