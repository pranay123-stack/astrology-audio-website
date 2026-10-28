import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, Quote, Scale, ScrollText, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { siteMenu, type MenuNode } from "@/components/layout/nav";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const ICONS: Partial<Record<MenuNode["key"], LucideIcon>> = {
  astrology: Sparkles,
  astroCricket: Trophy,
  book: BookOpen,
  research: ScrollText,
  rules: Scale,
  testimonials: Quote,
};

/** Home page: the site's sections as the menu lays them out, each with its sub-pages. */
export function ExploreMenu({ lang, youtube }: { lang: Locale; youtube?: string }) {
  const d = getDict(lang);
  const intro: Partial<Record<MenuNode["key"], string>> = {
    astrology: d.topics.astrology.intro,
    astroCricket: d.topics.astroCricket.intro,
    book: d.topics.book.intro,
    research: d.topics.research.intro,
    rules: d.topics.rules.intro,
    testimonials: d.topics.testimonials.intro,
  };
  const href = (n: MenuNode) => (n.external ? n.href : localePath(lang, n.href));
  const sections = siteMenu({ showPremium: false, youtube }).filter((n) => n.children);
  return (
    <section className="container-page py-16" aria-labelledby="explore-heading" data-testid="home-explore">
      <SectionHeading id="explore-heading" eyebrow={d.topics.exploreEyebrow} title={d.topics.exploreTitle} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = ICONS[s.key] ?? Sparkles;
          const links = s.children!.flatMap((c) => (c.children && c.key !== "kpAstrology" ? [c, ...c.children.filter((g) => g.key !== "video" && g.key !== "audio" && g.key !== "read")] : [c]));
          return (
            <article key={s.key} className="card flex flex-col gap-4 p-5" data-testid={`explore-${s.key}`}>
              <Link href={href(s)} className="group flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-plum-2 to-navy text-gold-soft">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-2xl font-semibold group-hover:text-gold-soft">{d.menu[s.key]}</span>
              </Link>
              <p className="text-sm text-ink/80">{intro[s.key]}</p>
              <ul className="mt-auto space-y-1.5 border-t border-line pt-3 text-sm">
                {links.map((c) => (
                  <li key={c.key + c.href}>
                    {c.external ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink/85 hover:text-gold-soft">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {d.menu[c.key]}
                      </a>
                    ) : (
                      <Link href={href(c)} className="inline-flex items-center gap-1.5 text-ink/85 hover:text-gold-soft">
                        <ArrowRight className="h-3.5 w-3.5 text-gold-soft" aria-hidden /> {d.menu[c.key]}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
