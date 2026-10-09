import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Starfield } from "@/components/layout/Starfield";
import { getProfile } from "@/lib/queries";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch to ask about personalised astrology consultations.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const profile = await getProfile();
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Ask for a personal consultation</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">
            Have a question about your chart, or want a personalised reading? Send a message and {profile.display_name} will reply by email.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <ContactForm />
        </Suspense>
        <aside className="space-y-6">
          {profile.consultation_info && (
            <div className="card space-y-3 p-6">
              <h2 className="text-2xl font-semibold">How consultations work</h2>
              <p className="text-sm whitespace-pre-line text-ink/80">{profile.consultation_info}</p>
            </div>
          )}
          {(profile.contact_email || profile.contact_phone || profile.location) && (
            <div className="card space-y-3 p-6 text-sm">
              <h2 className="text-2xl font-semibold">Other ways to reach us</h2>
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-2 hover:text-gold-soft">
                  <Mail className="h-4 w-4" aria-hidden /> {profile.contact_email}
                </a>
              )}
              {profile.contact_phone && (
                <a href={`tel:${profile.contact_phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-gold-soft">
                  <Phone className="h-4 w-4" aria-hidden /> {profile.contact_phone}
                </a>
              )}
              {profile.location && (
                <p className="flex items-center gap-2 text-muted">
                  <MapPin className="h-4 w-4" aria-hidden /> {profile.location}
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-muted">
            Consultations offer astrological perspectives only. They are not a substitute for medical, legal, financial or
            psychological advice.
          </p>
        </aside>
      </section>
    </>
  );
}
