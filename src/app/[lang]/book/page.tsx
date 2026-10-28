import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen, ExternalLink, FileText, Headphones } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { TopicHero, TopicPosts } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { BOOK_PARTS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const d = getDict(l);
  return { title: d.home.bookTitle, description: d.topics.book.intro, alternates: alternatesFor(l, "/book"), openGraph: { title: d.home.bookTitle, url: localePath(l, "/book") } };
}

export default async function BookPage() {
  const lang = await getLang();
  const d = getDict(lang);
  return (
    <>
      <TopicHero icon={BookOpen} eyebrow={d.home.bookEyebrow} title={d.home.bookTitle} intro={d.topics.book.intro}>
        <Suspense fallback={null}>
          <BuyButton lang={lang} />
        </Suspense>
      </TopicHero>
      <section className="container-page space-y-14 py-10">
        <nav aria-label={d.topics.book.sections} className="flex flex-wrap gap-2">
          {BOOK_PARTS.map((part) => (
            <a key={part.id} href={`#${part.id}`} className="chip border border-line bg-white/5 py-1.5 normal-case text-ink/85 hover:border-gold/50 hover:text-gold-soft">
              {part.format === "audio" ? <Headphones className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />} {d.menu[part.key]}
            </a>
          ))}
        </nav>
        {BOOK_PARTS.map((part) => (
          <section key={part.id} id={part.id} aria-labelledby={`${part.id}-heading`} className="scroll-mt-24 space-y-5" data-testid={`book-${part.id}`}>
            <h2 id={`${part.id}-heading`} className="flex items-center gap-3 text-3xl font-semibold">
              {part.format === "audio" ? <Headphones className="h-6 w-6 text-gold-soft" aria-hidden /> : <FileText className="h-6 w-6 text-gold-soft" aria-hidden />}
              {d.menu[part.key]}
            </h2>
            <Suspense fallback={<ListingSkeleton lang={lang} count={3} />}>
              <TopicPosts query={{ ...part.query, format: part.format }} lang={lang} limit={60} />
            </Suspense>
          </section>
        ))}
      </section>
    </>
  );
}

async function BuyButton({ lang }: { lang: Locale }) {
  const amazon = (await getProfile()).social_links?.amazon;
  if (!amazon) return null;
  return (
    <a href={amazon} target="_blank" rel="noopener noreferrer" className="btn-gold" data-testid="book-buy">
      <ExternalLink className="h-4 w-4" aria-hidden /> {getDict(lang).topics.book.buy}
    </a>
  );
}
