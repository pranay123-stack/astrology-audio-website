import type { Metadata } from "next";
import { KpChartLayout } from "@/components/kp/KpChartLayout";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLang()).kp;
  return { title: t.dash.all, robots: { index: false, follow: true } };
}

export default function AllKpChartsPage() {
  return <KpChartLayout view="all" />;
}
