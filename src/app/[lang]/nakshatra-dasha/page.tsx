import type { Metadata } from "next";
import { MoonStar } from "lucide-react";
import { NakshatraDashaApp } from "@/components/kp/NakshatraDashaApp";
import { TopicHero } from "@/components/topics/Topic";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).nakDasha;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: alternatesFor(l, "/nakshatra-dasha"),
    openGraph: { title: t.metaTitle, url: localePath(l, "/nakshatra-dasha") },
  };
}

export default async function NakshatraDashaPage() {
  const t = getDict(await getLang()).nakDasha;
  return (
    <>
      <TopicHero icon={MoonStar} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page py-10">
        <NakshatraDashaApp />
      </section>
    </>
  );
}
