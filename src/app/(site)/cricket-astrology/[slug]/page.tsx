import type { Metadata } from "next";
import { Suspense } from "react";
import { EpisodeDetail, episodeMetadata } from "@/components/episodes/EpisodeDetail";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";

export async function generateMetadata({ params }: PageProps<"/cricket-astrology/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return episodeMetadata(slug);
}

export default function EpisodePage({ params }: PageProps<"/cricket-astrology/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page py-10"><ListingSkeleton count={3} /></div>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/cricket-astrology/[slug]">, "params">) {
  const { slug } = await params;
  return <EpisodeDetail slug={slug} section="cricket" />;
}
