import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/layout/LegalPage";
import { getDict, localePath } from "@/lib/i18n";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { getLang } from "@/lib/i18n/server";

const DESCRIPTION = {
  en: "Astrology content on this site is for information and entertainment only.",
  hi: "इस साइट की ज्योतिष सामग्री केवल जानकारी और मनोरंजन के लिए है।",
};

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  return { title: getDict(l).footer.disclaimer, description: DESCRIPTION[l], alternates: alternatesFor(l, "/disclaimer") };
}

export default async function DisclaimerPage() {
  const lang = await getLang();
  const p = await getProfile();
  const business = p.legal_business_name || (lang === "hi" && p.hi?.display_name) || p.display_name;
  const contact = localePath(lang, "/contact");

  if (lang === "hi") {
    return (
      <LegalPage title={getDict(lang).footer.disclaimer} updated="2026-10-09" lang={lang}>
        <p>
          इस वेबसाइट पर <Fill value={business} placeholder="व्यवसाय का नाम" lang={lang} /> द्वारा प्रकाशित सभी ज्योतिष सामग्री — ऑडियो
          एपिसोड, लेख और परामर्श सहित — <strong>केवल जानकारी और मनोरंजन के उद्देश्य</strong> से दी जाती है।
        </p>
        <h2>क्रिकेट ज्योतिष</h2>
        <p>
          क्रिकेट विश्लेषण मैचों की ज्योतिषीय व्याख्याएँ हैं। ये क्रिकेट के सत्यापित आँकड़ों, टीम की खबरों या फ़ॉर्म के विश्लेषण पर आधारित
          नहीं हैं, और ये तथ्य के रूप में भविष्यवाणी नहीं हैं। ये किसी भी खेल परिणाम की गारंटी नहीं देते।
        </p>
        <ul>
          <li>इस साइट पर कुछ भी सट्टेबाज़ी, जुए या वित्तीय सलाह नहीं है।</li>
          <li>किसी भी जीत, लाभ या आर्थिक फ़ायदे का वादा या संकेत नहीं किया जाता।</li>
          <li>ज्योतिष सामग्री के आधार पर कभी भी दाँव न लगाएँ या कोई वित्तीय निर्णय न लें।</li>
          <li>यदि जुआ आपको नुकसान पहुँचा रहा है, तो निःशुल्क और गोपनीय सहायता के लिए किसी स्थानीय सहायता सेवा से संपर्क करें।</li>
        </ul>
        <h2>सटीकता का कोई दावा नहीं</h2>
        <p>
          यह साइट किसी भी विश्लेषण की पिछली सटीकता दर या सफलता दर प्रकाशित नहीं करती और न ही उसका दावा करती है। पिछले विश्लेषण, चाहे
          वे घटनाओं से मेल खाते दिखे हों या नहीं, भविष्य के विश्लेषणों के बारे में कुछ नहीं बताते।
        </p>
        <h2>व्यक्तिगत मार्गदर्शन</h2>
        <p>
          ज्योतिष पेशेवर चिकित्सा, मनोवैज्ञानिक, कानूनी या वित्तीय सलाह का विकल्प नहीं है। ऐसे मामलों के लिए कृपया किसी योग्य विशेषज्ञ से
          परामर्श लें।
        </p>
        <h2>नमूना सामग्री</h2>
        <p>“नमूना” चिह्न वाले एपिसोड केवल प्रदर्शन के लिए हैं। उनके मैच, टीम नाम और ऑडियो वास्तविक विश्लेषण नहीं हैं।</p>
        <p>
          कोई प्रश्न? <Link href={contact}>हमसे संपर्क करें</Link>।
        </p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title={getDict(lang).footer.disclaimer} updated="2026-10-09" lang={lang}>
      <p>
        All astrology content published on this website by <Fill value={business} placeholder="Business name" />,
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
        Questions? <Link href={contact}>Contact us</Link>.
      </p>
    </LegalPage>
  );
}
