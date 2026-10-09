import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { Starfield } from "@/components/layout/Starfield";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { premiumConfig } from "@/lib/config";
import { premiumContactHref } from "@/lib/episodes";
import { getEpisodes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Premium Audios",
  description: "In-depth premium astrology audio. Contact the astrologer for the full premium package.",
  alternates: { canonical: "/premium" },
};

export default async function PremiumPage() {
  const premium = await getEpisodes({ access: "premium", sort: "latest", limit: 12 });
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Lock className="h-6 w-6" aria-hidden />
            <p className="eyebrow">Premium</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">Premium Audios</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">
            Premium episodes go deeper: longer readings, detailed match analysis and extended lessons.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        {!premiumConfig.enabled && (
          <div className="card mb-12 grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center" data-testid="premium-status">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Get the full premium package</h2>
              <p className="text-ink/80">
                Premium readings are offered directly by the astrologer. Get in touch to ask about the full package: which readings it
                includes, the price, and how you will receive access. Free episodes remain open to everyone.
              </p>
            </div>
            <Link href={premiumContactHref()} className="btn-gold" data-testid="premium-contact">
              <Mail className="h-4 w-4" aria-hidden /> Contact the astrologer
            </Link>
          </div>
        )}
        <SectionHeading eyebrow="Library" title="Premium Episodes" description="These episodes are marked premium." />
        {premium.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {premium.items.map((e) => (
              <EpisodeCard key={e.id} episode={e} />
            ))}
          </div>
        ) : (
          <EmptyState title="No premium episodes yet">Premium audio will be listed here when it is published.</EmptyState>
        )}
      </section>
    </>
  );
}
