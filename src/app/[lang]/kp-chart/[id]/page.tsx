import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { KpChartLayout } from "@/components/kp/KpChartLayout";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A saved chart's own link. The birth details load in the browser, with the visitor's session
// (owner) or because the owner shared it; search engines are kept out.
export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLang()).kp;
  return { title: t.metaTitle, robots: { index: false, follow: false } };
}

export default function SavedKpChartPage({ params }: PageProps<"/[lang]/kp-chart/[id]">) {
  return (
    <Suspense fallback={null}>
      <Chart params={params} />
    </Suspense>
  );
}

async function Chart({ params }: Pick<PageProps<"/[lang]/kp-chart/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  return <KpChartLayout id={id.toLowerCase()} />;
}
