import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, Mail } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { MatchCard } from "@/components/episodes/MatchCard";
import { MediaAction } from "@/components/episodes/MediaAction";
import { CategoryIcon } from "@/components/episodes/categoryIcons";
import { Starfield } from "@/components/layout/Starfield";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { episodeHref, lengthLabel } from "@/lib/episodes";
import { getDict, localePath, localizeCategory, localizeEpisode, localizeProfile } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import { alternatesFor } from "@/lib/seo";
import { getCategories, getEpisodes, getProfile } from "@/lib/queries";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternatesFor(await getLang(), "/") };
}

export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const href = (path: string) => localePath(lang, path);
  const [latestGeneral, upcoming, recentCricket, categories, general, rawProfile] = await Promise.all([
    getEpisodes({ section: "general", limit: 3, sort: "latest" }),
    getEpisodes({ section: "cricket", timing: "upcoming", sort: "match_date_asc", limit: 3 }),
    getEpisodes({ section: "cricket", sort: "latest", limit: 3 }),
    getCategories(),
    getEpisodes({ section: "general", sort: "latest" }),
    getProfile(),
  ]);
  const cricket = upcoming.items.length > 0 ? upcoming.items : recentCricket.items;
  const generalCategories = categories.filter((c) => c.section === "general").map((c) => localizeCategory(c, lang));
  const profile = localizeProfile(rawProfile, lang);
  const portrait = imageUrl(profile.profile_image_path);
  const heroEpisode = latestGeneral.items[0] ? localizeEpisode(latestGeneral.items[0], lang) : null;

  return (
    <>
      {/* Hero: general astrology first; cricket readings are further down the page */}
      <section className="relative isolate overflow-hidden">
        <Starfield />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div className="animate-rise space-y-7">
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1 className="text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
              {t.home.titleA}{" "}
              <span className="bg-gradient-to-r from-gold-soft to-gold bg-clip-text text-transparent italic">{t.home.titleB}</span>
            </h1>
            <p className="max-w-xl text-lg text-ink/80">{t.home.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={href("/astrology-audios")} className="btn-gold px-6 py-3 text-base">
                <Headphones className="h-5 w-5" aria-hidden /> {t.home.listen}
              </Link>
              <Link href={href("/contact")} className="btn-ghost px-6 py-3 text-base">
                <Mail className="h-5 w-5" aria-hidden /> {t.home.book}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label={t.home.popularCategories}>
              {generalCategories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={href(`/astrology-audios?category=${c.slug}`)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 px-3 py-1.5 text-sm text-ink/80 hover:border-gold/50 hover:text-gold-soft"
                  >
                    <CategoryIcon slug={c.slug} className="h-4 w-4" /> {c.name}
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

      {/* General categories */}
      <section className="container-page py-16" aria-labelledby="general-heading">
        <SectionHeading
          id="general-heading"
          eyebrow={t.home.categoriesEyebrow}
          title={t.home.categoriesTitle}
          description={t.home.categoriesDesc}
          href={href("/astrology-audios")}
          linkLabel={t.home.allCategories}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {generalCategories.map((cat) => {
            const items = general.items.filter((e) => e.category.id === cat.id).map((e) => localizeEpisode(e, lang));
            return (
              <div key={cat.id} className="card flex flex-col p-5" data-testid="category-tile">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-plum-2 to-navy text-gold-soft">
                    <CategoryIcon slug={cat.slug} />
                  </span>
                  <h3 className="text-xl leading-tight font-semibold">
                    <Link href={href(`/astrology-audios?category=${cat.slug}`)} className="hover:text-gold-soft">
                      {cat.name}
                    </Link>
                  </h3>
                </div>
                <p className="mb-4 text-sm text-muted">{cat.description}</p>
                <ul className="mt-auto space-y-2 border-t border-line pt-3">
                  {items.slice(0, 2).map((e) => (
                    <li key={e.id}>
                      <Link href={episodeHref(e, lang)} className="group flex items-baseline justify-between gap-2 text-sm">
                        <span className="line-clamp-1 group-hover:text-gold-soft" lang={e.text_lang}>{e.title}</span>
                        <span className="shrink-0 text-xs text-muted">{lengthLabel(e, lang)}</span>
                      </Link>
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-xs text-muted">{t.home.comingSoon}</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest general audio */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow={t.home.latestEyebrow}
          title={t.home.latestTitle}
          description={t.home.latestDesc}
          href={href("/astrology-audios")}
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

      {/* Cricket: further down for visitors who keep scrolling */}
      <section className="relative py-16" aria-labelledby="cricket-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-plum/30 to-transparent" />
        <div className="container-page">
          <SectionHeading
            id="cricket-heading"
            eyebrow={t.home.cricketEyebrow}
            title={t.home.cricketTitle}
            description={upcoming.items.length ? t.home.cricketUpcoming : t.home.cricketRecent}
            href={href("/cricket-astrology")}
            linkLabel={t.home.allMatchReadings}
          />
          {cricket.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cricket.map((e) => (
                <MatchCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
          ) : (
            <EmptyState title={t.home.matchSoon}>{t.home.matchSoonBody}</EmptyState>
          )}
          <CricketDisclaimer lang={lang} className="mt-8" />
        </div>
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
          </div>
        </div>
      </section>

    </>
  );
}
