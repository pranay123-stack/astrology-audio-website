import type { Metadata } from "next";
import { Suspense } from "react";
import { Archive, CirclePlay, Clapperboard, Trophy } from "lucide-react";
import { ListingSkeleton } from "@/components/episodes/ListingSkeleton";
import { countPosts, HubCard, TopicHero, TopicPosts } from "@/components/topics/Topic";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getProfile } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { TOPICS } from "@/lib/topics";
import type { Locale } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).topics.astroCricket;
  return { title: t.title, description: t.intro, alternates: alternatesFor(l, "/astro-cricket"), openGraph: { title: t.title, url: localePath(l, "/astro-cricket") } };
}

export default async function AstroCricketPage() {
  const lang = await getLang();
  const t = getDict(lang).topics.astroCricket;
  return (
    <>
      <TopicHero icon={Trophy} eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <section className="container-page space-y-14 py-10">
        <Suspense fallback={<ListingSkeleton lang={lang} />}>
          <Hub lang={lang} />
        </Suspense>
      </section>
    </>
  );
}

async function Hub({ lang }: { lang: Locale }) {
  const d = getDict(lang);
  const t = d.topics.astroCricket;
  const href = (p: string) => localePath(lang, p);
  const [podcast, old, profile] = await Promise.all([countPosts(TOPICS.podcast), countPosts(TOPICS.oldVideos), getProfile()]);
  const youtube = profile.social_links?.youtube;
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <HubCard icon={Clapperboard} title={d.menu.podcast} body={t.podcastBody} href={href("/astro-cricket/videos")} count={podcast} lang={lang} testId="hub-podcast" />
        <HubCard icon={Archive} title={d.menu.oldVideos} body={t.oldBody} href={href("/astro-cricket/old-videos")} count={old} lang={lang} testId="hub-old-videos" />
        {youtube && <HubCard icon={CirclePlay} title={d.menu.youtube} body={t.youtubeBody} href={youtube} external lang={lang} testId="hub-youtube" />}
      </div>
      <section aria-labelledby="cricket-latest">
        <SectionHeading id="cricket-latest" eyebrow={d.topics.latest} title={d.menu.podcast} />
        <TopicPosts query={TOPICS.podcast} lang={lang} limit={6} />
      </section>
    </>
  );
}
