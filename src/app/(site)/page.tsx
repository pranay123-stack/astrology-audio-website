import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, Mail, Trophy } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { HeroMatch } from "@/components/episodes/HeroMatch";
import { MatchCard } from "@/components/episodes/MatchCard";
import { CategoryIcon } from "@/components/episodes/categoryIcons";
import { Starfield } from "@/components/layout/Starfield";
import { ZodiacWheel } from "@/components/layout/ZodiacWheel";
import { CricketDisclaimer } from "@/components/ui/Disclaimer";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { formatDurationLabel } from "@/lib/dates";
import { episodeHref } from "@/lib/episodes";
import { imageUrl } from "@/lib/media/urls";
import { getCategories, getEpisodes, getProfile } from "@/lib/queries";

export default async function HomePage() {
  const [featured, upcoming, recentCricket, categories, general, profile] = await Promise.all([
    getEpisodes({ limit: 3, sort: "latest" }),
    getEpisodes({ section: "cricket", timing: "upcoming", sort: "match_date_asc", limit: 3 }),
    getEpisodes({ section: "cricket", sort: "latest", limit: 3 }),
    getCategories(),
    getEpisodes({ section: "general", sort: "latest" }),
    getProfile(),
  ]);
  const cricket = upcoming.items.length > 0 ? upcoming.items : recentCricket.items;
  const heroUpcoming = upcoming.items.length > 0;
  const heroMatch = cricket.find((e) => e.match) ?? null;
  const generalCategories = categories.filter((c) => c.section === "general");
  const portrait = imageUrl(profile.profile_image_path);

  return (
    <>
      {/* Hero: leads with the next Big Bash League match prediction */}
      <section className="relative isolate overflow-hidden">
        <Starfield />
        {/* Stadium floodlight glows */}
        <div className="pointer-events-none absolute -top-40 left-[8%] h-96 w-96 rounded-full bg-sky-300/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -top-40 right-[6%] h-96 w-96 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="container-page relative grid gap-x-12 gap-y-8 py-12 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          {/* Mobile order: headline, match card, details. Desktop: text left, card right. */}
          <div className="animate-rise space-y-6 lg:self-end">
            <p className="eyebrow flex items-center gap-2">
              <Trophy className="h-4 w-4" aria-hidden /> Big Bash League · Cricket Astrology
            </p>
            <h1 className="text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
              BBL Match Predictions,{" "}
              <span className="bg-gradient-to-r from-gold-soft to-gold bg-clip-text text-transparent italic">Read in the Stars</span>
            </h1>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-lg lg:self-center">
            {heroMatch ? (
              <>
                <ZodiacWheel center="ball" className="pointer-events-none absolute -top-24 -right-40 hidden w-[34rem] opacity-30 lg:block" />
                <div className="relative">
                  <HeroMatch episode={heroMatch} upcoming={heroUpcoming} />
                </div>
              </>
            ) : (
              <ZodiacWheel center="ball" className="w-full drop-shadow-[0_0_60px_rgb(124_58_237/0.35)]" />
            )}
          </div>

          <div className="animate-rise space-y-7 lg:self-start">
            <p className="max-w-xl text-lg text-ink/80">
              Cricket astrology for every Big Bash League match. Hear what the planets suggest about each fixture in a short audio
              reading, published before the first ball is bowled.
            </p>
            <div className="flex flex-wrap gap-3">
              {heroMatch ? (
                <Link href={episodeHref(heroMatch)} className="btn-gold px-6 py-3 text-base">
                  <Headphones className="h-5 w-5" aria-hidden /> {heroUpcoming ? "Hear the Next Match Prediction" : "Hear the Latest Prediction"}
                </Link>
              ) : null}
              <Link href="/cricket-astrology" className={`${heroMatch ? "btn-ghost" : "btn-gold"} px-6 py-3 text-base`}>
                <Trophy className="h-5 w-5" aria-hidden /> All BBL Predictions
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> A reading before every match</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> Planetary timing of the fixture</li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                <Link href="/astrology-audios" className="underline-offset-4 hover:text-gold-soft hover:underline">Plus general astrology audio</Link>
              </li>
            </ul>
            <p className="text-xs text-muted">
              Astrological interpretation for entertainment, not betting advice.{" "}
              <Link href="/disclaimer" className="underline underline-offset-2 hover:text-gold-soft">Disclaimer</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Featured audio */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="Latest releases"
          title="Featured Audio"
          description="The newest episodes across cricket and general astrology."
          href="/astrology-audios"
          linkLabel="Browse all audio"
        />
        {featured.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.items.map((e, i) => (
              <EpisodeCard key={e.id} episode={e} priority={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState title="No episodes yet">New audio will appear here as soon as it is published.</EmptyState>
        )}
      </section>

      {/* Cricket */}
      <section className="relative py-16" aria-labelledby="cricket-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-plum/30 to-transparent" />
        <div className="container-page">
          <SectionHeading
            id="cricket-heading"
            eyebrow="Big Bash League"
            title="Cricket Astrology Predictions"
            description={
              upcoming.items.length
                ? "Astrological readings for upcoming BBL matches."
                : "No upcoming match readings right now — here are the most recent."
            }
            href="/cricket-astrology"
            linkLabel="All match readings"
          />
          {cricket.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cricket.map((e) => (
                <MatchCard key={e.id} episode={e} />
              ))}
            </div>
          ) : (
            <EmptyState title="Match readings coming soon">Cricket astrology audio will be listed here before each match.</EmptyState>
          )}
          <CricketDisclaimer className="mt-8" />
        </div>
      </section>

      {/* General categories */}
      <section className="container-page py-16" aria-labelledby="general-heading">
        <SectionHeading
          id="general-heading"
          eyebrow="General astrology"
          title="Explore by Category"
          description="Daily readings, transits, Vedic astrology, meditation and lessons."
          href="/astrology-audios"
          linkLabel="All categories"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {generalCategories.map((cat) => {
            const items = general.items.filter((e) => e.category.id === cat.id);
            return (
              <div key={cat.id} className="card flex flex-col p-5" data-testid="category-tile">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-plum-2 to-navy text-gold-soft">
                    <CategoryIcon slug={cat.slug} />
                  </span>
                  <h3 className="text-xl leading-tight font-semibold">
                    <Link href={`/astrology-audios?category=${cat.slug}`} className="hover:text-gold-soft">
                      {cat.name}
                    </Link>
                  </h3>
                </div>
                <p className="mb-4 text-sm text-muted">{cat.description}</p>
                <ul className="mt-auto space-y-2 border-t border-line pt-3">
                  {items.slice(0, 2).map((e) => (
                    <li key={e.id}>
                      <Link href={episodeHref(e)} className="group flex items-baseline justify-between gap-2 text-sm">
                        <span className="line-clamp-1 group-hover:text-gold-soft">{e.title}</span>
                        <span className="shrink-0 text-xs text-muted">{formatDurationLabel(e.duration_seconds)}</span>
                      </Link>
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-xs text-muted">Episodes coming soon</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section className="container-page py-16" aria-labelledby="about-heading">
        <div className="card grid overflow-hidden md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="relative aspect-square bg-plum md:aspect-auto">
            {portrait && <Image src={portrait} alt={`Portrait of ${profile.display_name}`} fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" />}
          </div>
          <div className="space-y-4 p-8 sm:p-10">
            <p className="eyebrow">About the astrologer</p>
            <h2 id="about-heading" className="text-4xl font-semibold">
              {profile.display_name}
            </h2>
            <p className="text-ink/85">{profile.biography}</p>
            {profile.specializations.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Specialisations">
                {profile.specializations.map((s) => (
                  <li key={s} className="chip border border-line bg-white/5 py-1 text-ink/80 normal-case">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-soft">
              Read more <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="relative isolate overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-plum-2 via-plum to-navy px-6 py-14 text-center sm:px-12">
          <Starfield />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-4xl font-semibold sm:text-5xl">Listen, follow, and ask your own question</h2>
            <p className="text-ink/80">
              Explore the full audio library, check back before each match for new readings, or get in touch to ask about a personal
              consultation.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/astrology-audios" className="btn-gold px-6 py-3">
                <Headphones className="h-5 w-5" aria-hidden /> Explore more audio
              </Link>
              <Link href="/contact" className="btn-ghost px-6 py-3">
                <Mail className="h-5 w-5" aria-hidden /> Contact the astrologer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
