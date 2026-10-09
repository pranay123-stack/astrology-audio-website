import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/layout/LegalPage";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms for using this website and its audio content.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const p = await getProfile();
  const business = p.legal_business_name || p.display_name;
  return (
    <LegalPage title="Terms and Conditions" updated="9 October 2026">
      <p>
        These terms apply to your use of this website, operated by <Fill value={business} placeholder="Business name" />. This is a
        starting template that should be reviewed with a legal adviser before launch.
      </p>
      <h2>Use of content</h2>
      <p>
        Audio episodes, text and images on this site are owned by or licensed to us. You may listen for personal, non-commercial use.
        You may not download, redistribute, re-upload or sell the content without written permission.
      </p>
      <h2>Nature of the content</h2>
      <p>
        All content is astrological interpretation for information and entertainment. It carries no guarantee of any outcome. Please
        read the <Link href="/disclaimer">disclaimer</Link>, which forms part of these terms.
      </p>
      <h2>Premium content</h2>
      <p>
        Some episodes are marked premium. Premium access is arranged directly with the astrologer as part of a full package; contact
        us through the <Link href="/contact">contact page</Link>. The price, what the package includes and any refund terms are agreed
        before payment.
      </p>
      <h2>Consultations</h2>
      <p>Personal consultations are arranged directly with the astrologer. Any fees and cancellation terms will be agreed before booking.</p>
      <h2>Liability</h2>
      <p>
        To the extent permitted by law, we are not liable for decisions you make or losses you incur based on content from this site.
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of <Fill value={p.legal_jurisdiction} placeholder="Jurisdiction" />.
      </p>
    </LegalPage>
  );
}
