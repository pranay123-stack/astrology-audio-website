import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Glasses, Sparkles, Sun } from "lucide-react";
import { countPosts, TopicHero, TopicPosts } from "@/components/topics/Topic";
import { learnPath } from "@/components/layout/nav";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getSiteContent } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.krishna;
  return {
    title: t.title,
    description: t.intro,
    alternates: alternatesFor(l, "/krishna-consciousness"),
    openGraph: { title: t.title, url: localePath(l, "/krishna-consciousness") },
  };
}

/** The astrologer's essay on fate and karma, in his own words (the same on both language sites). */
export default async function KrishnaConsciousnessPage() {
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.krishna;
  const [KRISHNA, posts] = await Promise.all([getSiteContent("krishna"), countPosts(TOPICS.krishnaPosts)]);
  return (
    <>
      <TopicHero icon={Sun} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <article lang="en" className="container-page mx-auto max-w-4xl space-y-14 py-12" data-testid="krishna-essay">
        {/* Neither "only fate" nor "only effort" */}
        <div className="grid gap-5 md:grid-cols-2">
          {KRISHNA.questions.map((q) => (
            <section key={q.thought} className="card flex flex-col gap-4 p-6">
              <p className="font-display text-2xl leading-snug text-ink/90 italic">“{q.thought}”</p>
              <p className="border-l-2 border-gold pl-4 text-ink/85">{q.answer}</p>
            </section>
          ))}
        </div>

        <section className="space-y-3 text-center">
          {KRISHNA.middle.map((m, i) => (
            <p key={m} className={i === 0 ? "font-display text-3xl font-semibold" : "mx-auto max-w-2xl text-lg text-ink/85"}>{m}</p>
          ))}
        </section>

        {/* The pair of glasses */}
        <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-soft">
            <Glasses className="h-8 w-8" aria-hidden />
          </span>
          <div className="space-y-2 text-lg text-ink/90">
            {KRISHNA.story.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </div>
        </section>

        {/* 12% luck, 88% karma */}
        <section aria-label={t.luckVsKarma} className="space-y-4" data-testid="luck-karma">
          <div className="flex h-4 overflow-hidden rounded-full border border-line" aria-hidden>
            <div className="bg-white/30" style={{ width: `${Math.min(100, parseFloat(KRISHNA.luck.share) || 0)}%` }} />
            <div className="flex-1 bg-gradient-to-r from-gold to-gold-soft" />
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
            {[KRISHNA.luck, KRISHNA.karma].map((x, i) => (
              <div key={x.share} className={`card space-y-3 p-6 ${i === 1 ? "border-gold/50" : ""}`}>
                <p className={`font-display text-6xl font-semibold ${i === 1 ? "text-gold-soft" : "text-ink/80"}`}>{x.share}</p>
                <p className="eyebrow">{x.label}</p>
                <p className="text-ink/85">{x.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-4xl font-semibold">{KRISHNA.how.question}</h2>
          {KRISHNA.how.answer.map((a) => (
            <p key={a} className="text-lg text-ink/90">{a}</p>
          ))}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gold/10 px-6 py-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-gold-soft" aria-hidden />
          <p className="mt-3 font-display text-4xl font-semibold text-gold-soft sm:text-5xl">{KRISHNA.closing}</p>
          <Link href={localePath(lang, learnPath(d.learn.subject))} className="btn-gold mt-6 inline-flex" lang={lang}>
            {d.nav.learn} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </article>
      {posts > 0 && (
        <section className="container-page py-10">
          <TopicPosts query={TOPICS.krishnaPosts} lang={lang} />
        </section>
      )}
    </>
  );
}
