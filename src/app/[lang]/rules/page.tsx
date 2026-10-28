import type { Metadata } from "next";
import { Flame, HeartHandshake, Orbit, Scale, Trophy } from "lucide-react";
import { TopicHero } from "@/components/topics/Topic";
import { CRICKET_RULES, SHANI_RULES, SPIRITUAL_RULES, type Rule } from "@/content/rules";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.rules;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/rules"), openGraph: { title: t.title, url: localePath(l, "/rules") } };
}

export default async function RulesPage() {
  const lang = await getLang();
  const d = getDict(lang);
  const t = d.topics.rules;
  const sections = [
    { id: "spiritual", title: t.spiritual, intro: t.spiritualIntro, rules: SPIRITUAL_RULES, icon: Flame },
    { id: "cricket", title: t.cricket, intro: t.cricketIntro, rules: CRICKET_RULES, icon: Trophy },
    { id: "shani", title: t.shani, intro: t.shaniIntro, rules: SHANI_RULES, icon: Orbit },
  ];
  return (
    <>
      <TopicHero icon={Scale} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-16 py-10">
        <nav aria-label={t.title} className="grid gap-4 sm:grid-cols-3">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="card group flex items-center gap-4 p-5 hover:border-gold/50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-soft">
                <s.icon className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-2xl font-semibold group-hover:text-gold-soft">{s.title}</span>
                <span className="text-xs text-muted">{t.rules(s.rules.length)}</span>
              </span>
            </a>
          ))}
        </nav>
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="scroll-mt-24 space-y-6" data-testid={`rules-${s.id}`}>
            <div className="space-y-2">
              <h2 id={`${s.id}-heading`} className="flex items-center gap-3 text-4xl font-semibold">
                <s.icon className="h-7 w-7 text-gold-soft" aria-hidden /> {s.title}
              </h2>
              <p className="max-w-2xl text-ink/80">{s.intro}</p>
            </div>
            <ol className="grid gap-5 md:grid-cols-2">
              {s.rules.map((r, i) => (
                <RuleCard key={r.title} rule={r} n={i + 1} labels={{ planet: t.planet, chakra: t.chakra }} />
              ))}
            </ol>
          </section>
        ))}
      </section>
    </>
  );
}

function RuleCard({ rule, n, labels }: { rule: Rule; n: number; labels: { planet: string; chakra: string } }) {
  return (
    // The rules are the astrologer's own words, in English and Hinglish, on both language sites.
    <li lang="en" className="card flex gap-4 p-6" data-testid="rule">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/50 font-display text-xl text-gold-soft" aria-hidden>
        {n}
      </span>
      <div className="min-w-0 space-y-3">
        <h3 className="text-2xl font-semibold leading-snug">{rule.title}</h3>
        {rule.body?.map((p) => (
          <p key={p} className="text-ink/85">{p}</p>
        ))}
        {rule.list && (
          <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {rule.list.map((it) => (
              <div key={it.label} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-2.5 text-sm">
                <dt className="font-semibold text-gold-soft">{it.label}</dt>
                <dd className="text-ink/85">{it.text}</dd>
              </div>
            ))}
          </dl>
        )}
        {rule.note && <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">{rule.note}</p>}
        {(rule.planet || rule.chakra) && (
          <p className="flex flex-wrap gap-2 text-xs">
            {rule.planet && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                <Orbit className="h-3.5 w-3.5 text-gold-soft" aria-hidden /> {labels.planet}: {rule.planet}
              </span>
            )}
            {rule.chakra && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                <HeartHandshake className="h-3.5 w-3.5 text-gold-soft" aria-hidden /> {labels.chakra}: {rule.chakra}
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
