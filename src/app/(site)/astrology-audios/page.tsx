import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Headphones, Search } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { LoadMore } from "@/components/episodes/LoadMore";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { CategoryIcon } from "@/components/episodes/categoryIcons";
import { Starfield } from "@/components/layout/Starfield";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { PAGE_SIZE, parseListParams, toQueryString } from "@/lib/list-params";
import { getCategories, getEpisodes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Astrology Audios — Daily Readings, Transits and Vedic Astrology",
  description:
    "Browse astrology audio by category: daily astrology, horoscope insights, planetary transits, zodiac guidance, Vedic astrology, meditation and lessons.",
  alternates: { canonical: "/astrology-audios" },
  openGraph: { title: "Astrology Audios", url: "/astrology-audios" },
};

export default function AstrologyAudiosPage({ searchParams }: PageProps<"/astrology-audios">) {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Headphones className="h-6 w-6" aria-hidden />
            <p className="eyebrow">General astrology</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Astrology Audios</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">
            Listen to readings and lessons on the planets, the signs and the traditions behind them. Choose a category or search the
            library.
          </p>
        </div>
      </section>
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/astrology-audios">, "searchParams">) {
  const p = parseListParams(await searchParams);
  const categories = (await getCategories()).filter((c) => c.section === "general");
  const activeCategory = categories.find((c) => c.slug === p.category);
  const filtered = !!(p.q || p.access || activeCategory);

  const [{ items, total }, popular] = await Promise.all([
    getEpisodes({
      section: "general",
      categorySlug: activeCategory?.slug,
      search: p.q || undefined,
      access: p.access || undefined,
      sort: p.sort,
      limit: p.page * PAGE_SIZE,
    }),
    filtered || p.sort === "popular" ? Promise.resolve(null) : getEpisodes({ section: "general", sort: "popular", limit: 3 }),
  ]);

  const chip = (slug: string, label: string, active: boolean) => (
    <Link
      key={slug || "all"}
      href={`/astrology-audios${toQueryString({ ...p, category: slug, page: 1 }, { sort: "latest" })}`}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-gold bg-gold/15 text-gold-soft" : "border-line text-ink/80 hover:border-gold/50"
      }`}
    >
      {slug && <CategoryIcon slug={slug} className="h-4 w-4" />}
      {label}
    </Link>
  );

  return (
    <div className="space-y-10">
      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        {chip("", "All categories", !activeCategory)}
        {categories.map((c) => chip(c.slug, c.name, c.slug === activeCategory?.slug))}
      </nav>

      <Form action="/astrology-audios" className="card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
        <div>
          <label htmlFor="q" className="label">Search titles and keywords</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" name="q" defaultValue={p.q} placeholder="e.g. Saturn, nakshatra, full moon" className="input pl-9" />
          </div>
        </div>
        <div>
          <label htmlFor="access" className="label">Access</label>
          <select id="access" name="access" defaultValue={p.access} className="input">
            <option value="">Free and premium</option>
            <option value="free">Free only</option>
            <option value="premium">Premium only</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">Sort by</label>
          <select id="sort" name="sort" defaultValue={p.sort} className="input">
            <option value="latest">Latest</option>
            <option value="popular">Most played</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-gold w-full md:w-auto">Apply</button>
          {(p.q || p.access || p.sort !== "latest") && (
            <Link href={`/astrology-audios${toQueryString({ category: p.category })}`} className="btn-ghost">Clear</Link>
          )}
        </div>
      </Form>

      {popular && popular.items.length > 0 && (
        <section aria-labelledby="popular-heading">
          <SectionHeading id="popular-heading" eyebrow="Most played" title="Popular Audios" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.items.map((e) => (
              <EpisodeCard key={e.id} episode={e} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="latest-heading">
        <SectionHeading
          id="latest-heading"
          eyebrow={activeCategory ? "Category" : p.sort === "popular" ? "Most played first" : "Newest first"}
          title={activeCategory ? activeCategory.name : p.q ? `Results for “${p.q}”` : "Latest Episodes"}
          description={activeCategory?.description}
        />
        {items.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
            <LoadMore shown={items.length} total={total} href={`/astrology-audios${toQueryString({ ...p, page: p.page + 1 }, { sort: "latest" })}`} />
          </>
        ) : (
          <EmptyState title={filtered ? "Nothing matches your search" : "No episodes yet"}>
            {filtered ? "Try another keyword or category." : "New audio will appear here once it is published."}
          </EmptyState>
        )}
      </section>
    </div>
  );
}
