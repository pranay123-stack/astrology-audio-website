import Link from "next/link";
import { ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { LoadMore } from "@/components/episodes/LoadMore";
import { Starfield } from "@/components/layout/Starfield";
import { EmptyState } from "@/components/ui/SectionHeading";
import { getDict } from "@/lib/i18n";
import { PAGE_SIZE } from "@/lib/list-params";
import { getEpisodes } from "@/lib/queries";
import type { EpisodeQuery, Locale } from "@/lib/types";

/** The hero at the top of each menu page. */
export function TopicHero({
  icon: Icon,
  eyebrow,
  title,
  intro,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <Starfield />
      <div className="container-page relative py-14 sm:py-20">
        <div className="flex items-center gap-3 text-gold-soft">
          <Icon className="h-6 w-6" aria-hidden />
          <p className="eyebrow">{eyebrow}</p>
        </div>
        <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/80">{intro}</p>
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

/** A card on a section's overview page: what the sub-page holds, how many posts, and its own sub-links. */
export function HubCard({
  icon: Icon,
  title,
  body,
  href,
  count,
  links = [],
  external = false,
  lang,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  count?: number;
  links?: { label: string; href: string; count?: number }[];
  external?: boolean;
  lang: Locale;
  testId?: string;
}) {
  const t = getDict(lang).topics;
  const heading = (
    <span className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-soft">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="space-y-1">
        <span className="block font-display text-2xl font-semibold group-hover:text-gold-soft">{title}</span>
        <span className="block text-sm text-ink/80">{body}</span>
        {count !== undefined && <span className="block text-xs text-muted">{count ? t.posts(count) : t.soon}</span>}
      </span>
    </span>
  );
  return (
    <article className="card flex flex-col gap-4 p-6" data-testid={testId}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group">
          {heading}
        </a>
      ) : (
        <Link href={href} className="group">
          {heading}
        </Link>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="chip border border-line bg-white/5 py-1.5 normal-case text-ink/85 hover:border-gold/50 hover:text-gold-soft">
            {l.label}
            {l.count !== undefined && <span className="text-muted">({l.count})</span>}
          </Link>
        ))}
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-gold ml-auto px-4 py-2 text-sm">
            <ExternalLink className="h-4 w-4" aria-hidden /> {title}
          </a>
        ) : (
          <Link href={href} className="btn-ghost ml-auto px-4 py-2 text-sm">
            {t.viewAll} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}

/** Filter tabs (e.g. All · Video · Audio · Read), as links so they work without JavaScript. */
export function TopicTabs({ tabs, label }: { tabs: { label: string; href: string; active: boolean; count?: number }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2" data-testid="topic-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          scroll={false}
          aria-current={tab.active ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            tab.active ? "border-gold bg-gold text-night" : "border-line bg-white/5 text-ink/80 hover:border-gold/50"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && <span className={tab.active ? "text-night/70" : "text-muted"}>{tab.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Grid of posts for a query, with "Load more". `base` is the page URL with its filters, without `page`. */
export async function TopicPosts({
  query,
  lang,
  page = 1,
  base,
  limit,
}: {
  query: EpisodeQuery;
  lang: Locale;
  page?: number;
  base?: string;
  /** Show at most this many, without "Load more" (overview pages). */
  limit?: number;
}) {
  const t = getDict(lang).topics;
  const { items, total } = await getEpisodes({ ...query, limit: limit ?? page * PAGE_SIZE });
  if (!items.length) return <EmptyState title={t.emptyTitle}>{t.emptyBody}</EmptyState>;
  const next = base ? `${base}${base.includes("?") ? "&" : "?"}page=${page + 1}` : "";
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="topic-posts">
        {items.map((e, i) => (
          <EpisodeCard key={e.id} episode={e} lang={lang} priority={i < 3} />
        ))}
      </div>
      {!limit && base && <LoadMore lang={lang} shown={items.length} total={total} href={next} />}
    </>
  );
}

/** Number of published posts for a query. */
export async function countPosts(query: EpisodeQuery): Promise<number> {
  return (await getEpisodes({ ...query, limit: 1 })).total;
}

