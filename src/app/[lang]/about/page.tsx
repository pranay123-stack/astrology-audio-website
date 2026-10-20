import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Starfield } from "@/components/layout/Starfield";
import { getDict, localePath, localizeProfile } from "@/lib/i18n";
import { imageUrl } from "@/lib/media/urls";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).about;
  const profile = localizeProfile(await getProfile(), l);
  return {
    title: t.metaTitle(profile.display_name),
    description: profile.tagline || t.metaDesc,
    alternates: alternatesFor(l, "/about"),
  };
}

export default async function AboutPage() {
  const lang = await getLang();
  const t = getDict(lang);
  const profile = localizeProfile(await getProfile(), lang);
  const portrait = imageUrl(profile.profile_image_path);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="space-y-4">
            <p className="eyebrow">{t.about.eyebrow}</p>
            <h1 className="text-5xl font-semibold sm:text-6xl">{profile.display_name}</h1>
            {profile.tagline && <p className="text-xl text-ink/80">{profile.tagline}</p>}
            {profile.location && <p className="text-sm text-muted">{profile.location}</p>}
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border border-gold/30 shadow-[var(--shadow-glow)]">
            {portrait && <Image src={portrait} alt={t.common.portraitOf(profile.display_name)} fill sizes="340px" className="object-cover" priority />}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="prose-cosmic max-w-3xl">
          <h2>{t.about.intro}</h2>
          {profile.biography.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {profile.experience && (
            <>
              <h2>{t.about.experience}</h2>
              {profile.experience.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </>
          )}
          {profile.consultation_info && (
            <>
              <h2>{t.about.consultations}</h2>
              {profile.consultation_info.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </>
          )}
        </div>
        <aside className="space-y-6">
          {profile.specializations.length > 0 && (
            <div className="card p-6">
              <h2 className="eyebrow mb-4 font-sans">{t.about.specialisations}</h2>
              <ul className="space-y-2">
                {profile.specializations.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-ink/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card space-y-4 p-6">
            <h2 className="text-2xl font-semibold">{t.about.bookTitle}</h2>
            <p className="text-sm text-muted">{t.about.bookBody}</p>
            <Link href={localePath(lang, "/contact")} className="btn-gold w-full">
              <Mail className="h-4 w-4" aria-hidden /> {t.common.contactCta}
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
