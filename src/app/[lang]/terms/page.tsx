import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/layout/LegalPage";
import { getDict, localePath } from "@/lib/i18n";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  return { title: getDict(l).footer.terms, description: "Terms for using this website and its audio content.", alternates: alternatesFor(l, "/terms") };
}

export default async function TermsPage() {
  const lang = await getLang();
  const href = (path: string) => localePath(lang, path);
  const p = await getProfile();
  const business = p.legal_business_name || p.display_name;
  return (
    <LegalPage title={getDict(lang).footer.terms} updated="2026-10-09" lang={lang} bodyLang="en">
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
        read the <Link href={href("/disclaimer")}>disclaimer</Link>, which forms part of these terms.
      </p>
      <h2>Premium content</h2>
      <p>
        Some episodes are marked premium. Premium access is arranged directly with the astrologer as part of a full package; contact
        us through the <Link href={href("/contact")}>contact page</Link>. The price, what the package includes and any refund terms are agreed
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
