import type { Metadata } from "next";
import { Suspense } from "react";
import { EpisodeDetail, episodeMetadata } from "@/components/episodes/EpisodeDetail";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/cricket-astrology/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return episodeMetadata(slug, await getLang());
}

export default function EpisodePage({ params }: PageProps<"/[lang]/cricket-astrology/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page py-10"><ListingSkeleton count={3} /></div>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/[lang]/cricket-astrology/[slug]">, "params">) {
  const { slug } = await params;
  const lang = await getLang();
  return <EpisodeDetail slug={slug} section="cricket" lang={lang} />;
}
