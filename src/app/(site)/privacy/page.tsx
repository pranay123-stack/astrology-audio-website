import type { Metadata } from "next";
import { Fill, LegalPage } from "@/components/layout/LegalPage";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How this website collects and uses personal information.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const p = await getProfile();
  const business = p.legal_business_name || p.display_name;
  return (
    <LegalPage title="Privacy Policy" updated="9 October 2026">
      <p>
        This policy explains how <Fill value={business} placeholder="Business name" /> (“we”, “us”) handles personal information on
        this website. It is a starting template; the business owner should review it with a legal adviser for their jurisdiction (
        <Fill value={p.legal_jurisdiction} placeholder="Jurisdiction" />).
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Contact form:</strong> your name, email address, subject and message, so we can reply to you.</li>
        <li><strong>Listening statistics:</strong> an anonymous count of how many times each episode is played. No personal identifier is stored with it.</li>
        <li><strong>Preferences:</strong> your player volume and speed are saved in your own browser (local storage) and never sent to us.</li>
        <li><strong>Server logs:</strong> our hosting provider may keep standard request logs (such as IP address and browser type) for security and reliability.</li>
      </ul>
      <h2>Cookies</h2>
      <p>
        Visitors receive no tracking or advertising cookies. A strictly necessary session cookie is set only when the site
        administrator signs in.
      </p>
      <h2>How we use and share information</h2>
      <p>
        We use contact details only to respond to your enquiry and, if you book one, to arrange a consultation. We do not sell personal
        information. Data is stored with our hosting and database providers, who process it on our behalf.
      </p>
      <h2>Retention and your rights</h2>
      <p>
        We keep messages for as long as needed to handle your enquiry. You may ask to access, correct or delete your information by
        contacting <Fill value={p.contact_email} placeholder="Contact email" />.
      </p>
      <h2>Changes</h2>
      <p>We will update this page if our practices change.</p>
    </LegalPage>
  );
}
