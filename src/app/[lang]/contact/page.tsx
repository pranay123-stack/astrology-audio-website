import type { Metadata } from "next";
import { Suspense } from "react";
import { Starfield } from "@/components/layout/Starfield";
import { getDict, localizeProfile } from "@/lib/i18n";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { ContactChannels } from "@/components/layout/ContactChannels";
import { ContactForm } from "./ContactForm";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l);
  return { title: t.nav.contact, description: t.contact.metaDesc, alternates: alternatesFor(l, "/contact") };
}

export default async function ContactPage() {
  const lang = await getLang();
  const t = getDict(lang).contact;
  const profile = localizeProfile(await getProfile(), lang);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro(profile.display_name)}</p>
        </div>
      </section>
      <section className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <ContactForm />
        </Suspense>
        {/* On phones the direct channels (WhatsApp first) appear above the form. */}
        <aside className="order-first space-y-6 lg:order-none">
          <ContactChannels profile={profile} lang={lang} />
          {profile.consultation_info && (
            <div className="card space-y-3 p-6">
              <h2 className="text-2xl font-semibold">{t.howTitle}</h2>
              <p className="text-sm whitespace-pre-line text-ink/80">{profile.consultation_info}</p>
            </div>
          )}
          <p className="text-xs text-muted">{t.note}</p>
        </aside>
      </section>
    </>
  );
}
