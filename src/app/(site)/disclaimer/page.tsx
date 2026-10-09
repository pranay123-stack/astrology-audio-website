import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/layout/LegalPage";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Astrology content on this site is for information and entertainment only.",
  alternates: { canonical: "/disclaimer" },
};

export default async function DisclaimerPage() {
  const p = await getProfile();
  return (
    <LegalPage title="Disclaimer" updated="9 October 2026">
      <p>
        All astrology content published on this website by <Fill value={p.legal_business_name || p.display_name} placeholder="Business name" />,
        including audio episodes, written notes and consultations, is provided for <strong>informational and entertainment purposes
        only</strong>.
      </p>
      <h2>Cricket astrology</h2>
      <p>
        Cricket readings are astrological interpretations of matches. They are not based on verified cricket statistics, team news or
        form analysis, and they are not predictions of fact. They do not guarantee any sporting outcome.
      </p>
      <ul>
        <li>Nothing on this site is betting, gambling or financial advice.</li>
        <li>No winnings, profits or financial returns are promised or implied.</li>
        <li>Never place a bet or make a financial decision on the basis of astrology content.</li>
        <li>If gambling is causing you harm, contact a local support service for free, confidential help.</li>
      </ul>
      <h2>No claims of accuracy</h2>
      <p>
        This site does not publish or claim a historical accuracy rate or success rate for any reading. Past readings, whether they
        appeared to match events or not, say nothing about future readings.
      </p>
      <h2>Personal guidance</h2>
      <p>
        Astrology is not a substitute for professional medical, psychological, legal or financial advice. Please consult a qualified
        professional for those matters.
      </p>
      <h2>Sample content</h2>
      <p>
        Episodes labelled “Sample” are demonstration placeholders. Their fixtures, team names and audio are not real readings.
      </p>
      <p>
        Questions? <Link href="/contact">Contact us</Link>.
      </p>
    </LegalPage>
  );
}
