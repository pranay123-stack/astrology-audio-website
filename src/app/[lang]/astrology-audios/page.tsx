import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Sparkles } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { FormatChips } from "@/components/episodes/FormatChips";
import { LoadMore } from "@/components/episodes/LoadMore";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { CategoryIcon } from "@/components/episodes/categoryIcons";
import { Starfield } from "@/components/layout/Starfield";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath, localizeCategory } from "@/lib/i18n";
import { PAGE_SIZE, parseListParams, toQueryString } from "@/lib/list-params";
import { getCategories, getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).general;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: alternatesFor(l, "/astrology-audios"),
    openGraph: { title: t.ogTitle, url: localePath(l, "/astrology-audios") },
  };
}

export default async function AstrologyAudiosPage({ searchParams }: PageProps<"/[lang]/astrology-audios">) {
  const lang = await getLang();
  const t = getDict(lang).general;
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Sparkles className="h-6 w-6" aria-hidden />
            <p className="eyebrow">{t.eyebrow}</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro}</p>
        </div>
      </section>
      <section className="container-page py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Results searchParams={searchParams} lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams, lang }: Pick<PageProps<"/[lang]/astrology-audios">, "searchParams"> & { lang: Locale }) {
  const d = getDict(lang);
  const t = d.general;
  const base = localePath(lang, "/astrology-audios");
  const p = parseListParams(await searchParams);
  const categories = (await getCategories()).filter((c) => c.section === "general").map((c) => localizeCategory(c, lang));
  const activeCategory = categories.find((c) => c.slug === p.category);
  const filtered = !!(p.q || p.access || activeCategory || p.format);

  const [{ items, total }, popular, all] = await Promise.all([
    getEpisodes({
      section: "general",
      categorySlug: activeCategory?.slug,
      search: p.q || undefined,
      access: p.access || undefined,
      format: p.format || undefined,
      sort: p.sort,
      limit: p.page * PAGE_SIZE,
    }),
    filtered || p.sort === "popular" ? Promise.resolve(null) : getEpisodes({ section: "general", sort: "popular", limit: 3 }),
    // Which types (articles, audio, videos, reels) exist, for the type filter.
    getEpisodes({ section: "general", categorySlug: activeCategory?.slug }),
  ]);
  // "Popular" only means something once posts have been played; until then it would repeat "Latest".
  const showPopular = !!popular && popular.items.length > 0 && popular.items[0].play_count > 0;

  const chip = (slug: string, label: string, active: boolean) => (
    <Link
      key={slug || "all"}
      href={`${base}${toQueryString({ ...p, category: slug, page: 1 }, { sort: "latest" })}`}
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
      <nav aria-label={t.categoriesNav} className="flex flex-wrap gap-2">
        {chip("", t.allCategories, !activeCategory)}
        {categories.map((c) => chip(c.slug, c.name, c.slug === activeCategory?.slug))}
      </nav>
      <FormatChips posts={all.items} params={p} base={base} defaults={{ sort: "latest" }} lang={lang} />

      <Form action={base} className="card grid gap-4 p-5 md:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
        {p.format && <input type="hidden" name="format" value={p.format} />}
        <div>
          <label htmlFor="q" className="label">{t.searchLabel}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" name="q" defaultValue={p.q} placeholder={t.searchPlaceholder} className="input pl-9" />
          </div>
        </div>
        <div>
          <label htmlFor="access" className="label">{d.common.access}</label>
          <select id="access" name="access" defaultValue={p.access} className="input">
            <option value="">{d.common.freeAndPremium}</option>
            <option value="free">{d.common.freeOnly}</option>
            <option value="premium">{d.common.premiumOnly}</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">{t.sortBy}</label>
          <select id="sort" name="sort" defaultValue={p.sort} className="input">
            <option value="latest">{t.latest}</option>
            <option value="popular">{t.mostPlayed}</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-gold w-full md:w-auto">{d.common.apply}</button>
          {(p.q || p.access || p.sort !== "latest") && (
            <Link href={`${base}${toQueryString({ category: p.category, format: p.format })}`} className="btn-ghost">{d.common.clear}</Link>
          )}
        </div>
      </Form>

      {showPopular && popular && (
        <section aria-labelledby="popular-heading">
          <SectionHeading id="popular-heading" eyebrow={t.mostPlayed} title={t.popularTitle} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.items.map((e) => (
              <EpisodeCard key={e.id} episode={e} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="latest-heading">
        <SectionHeading
          id="latest-heading"
          eyebrow={activeCategory ? t.category : p.sort === "popular" ? t.mostPlayedFirst : t.newestFirst}
          title={activeCategory ? activeCategory.name : p.q ? t.resultsFor(p.q) : t.latestEpisodes}
          description={activeCategory?.description}
        />
        {items.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <EpisodeCard key={e.id} episode={e} lang={lang} />
              ))}
            </div>
            <LoadMore
              lang={lang}
              shown={items.length}
              total={total}
              href={`${base}${toQueryString({ ...p, page: p.page + 1 }, { sort: "latest" })}`}
            />
          </>
        ) : (
          <EmptyState title={filtered ? t.noMatch : t.none}>{filtered ? t.noMatchBody : t.noneBody}</EmptyState>
        )}
      </section>
    </div>
  );
}
