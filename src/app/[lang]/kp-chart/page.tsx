import type { Metadata } from "next";
import { KpChartLayout } from "@/components/kp/KpChartLayout";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).kp;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: alternatesFor(l, "/kp-chart"),
    openGraph: { title: t.metaTitle, url: localePath(l, "/kp-chart") },
  };
}

export default function KpChartPage() {
  return <KpChartLayout />;
}
