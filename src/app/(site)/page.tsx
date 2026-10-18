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
import { imageUrl } from "@/lib/media/urls";
import { getCategories, getEpisodes, getProfile } from "@/lib/queries";

export default async function HomePage() {
  const [latestGeneral, upcoming, recentCricket, categories, general, profile] = await Promise.all([
    getEpisodes({ section: "general", limit: 3, sort: "latest" }),
    getEpisodes({ section: "cricket", timing: "upcoming", sort: "match_date_asc", limit: 3 }),
    getEpisodes({ section: "cricket", sort: "latest", limit: 3 }),
    getCategories(),
    getEpisodes({ section: "general", sort: "latest" }),
    getProfile(),
  ]);
  const cricket = upcoming.items.length > 0 ? upcoming.items : recentCricket.items;
  const generalCategories = categories.filter((c) => c.section === "general");
  const portrait = imageUrl(profile.profile_image_path);
  const heroEpisode = latestGeneral.items[0] ?? null;

  return (
    <>
      {/* Hero: general astrology first; cricket readings are further down the page */}
      <section className="relative isolate overflow-hidden">
        <Starfield />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div className="animate-rise space-y-7">
            <p className="eyebrow">Vedic astrology · Horoscopes · Guidance in audio</p>
            <h1 className="text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
              Discover Astrology{" "}
              <span className="bg-gradient-to-r from-gold-soft to-gold bg-clip-text text-transparent italic">Through Audio</span>
            </h1>
            <p className="max-w-xl text-lg text-ink/80">
              Daily readings, planetary transits, zodiac guidance and Vedic wisdom, explained in clear, calm audio you can listen to
              anywhere.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/astrology-audios" className="btn-gold px-6 py-3 text-base">
                <Headphones className="h-5 w-5" aria-hidden /> Listen to Astrology Audios
              </Link>
              <Link href="/contact" className="btn-ghost px-6 py-3 text-base">
                <Mail className="h-5 w-5" aria-hidden /> Book a Consultation
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Popular categories">
              {generalCategories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/astrology-audios?category=${c.slug}`}
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
                <MediaAction episode={heroEpisode} label={heroEpisode.title} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-gold uppercase">Latest reading</p>
                  <Link href={episodeHref(heroEpisode)} className="line-clamp-1 text-sm font-semibold hover:text-gold-soft">
                    {heroEpisode.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {heroEpisode.category.name} · {lengthLabel(heroEpisode)}
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
                        <span className="shrink-0 text-xs text-muted">{lengthLabel(e)}</span>
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

      {/* Latest general audio */}
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="Latest releases"
          title="Latest Astrology Audio"
          description="The newest readings, lessons and guidance."
          href="/astrology-audios"
          linkLabel="Browse all audio"
        />
        {latestGeneral.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestGeneral.items.map((e, i) => (
              <EpisodeCard key={e.id} episode={e} priority={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState title="No episodes yet">New audio will appear here as soon as it is published.</EmptyState>
        )}
      </section>

      {/* Cricket: further down for visitors who keep scrolling */}
      <section className="relative py-16" aria-labelledby="cricket-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-plum/30 to-transparent" />
        <div className="container-page">
          <SectionHeading
            id="cricket-heading"
            eyebrow="Also on the site · Big Bash League"
            title="Cricket Astrology"
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

      {/* About the astrologer: last section before the footer */}
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

    </>
  );
}
