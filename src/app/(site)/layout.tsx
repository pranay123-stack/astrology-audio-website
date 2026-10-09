import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { MiniPlayer } from "@/components/audio/MiniPlayer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioPlayerProvider>
      <SiteHeader />
      <DemoBanner />
      <main id="main">{children}</main>
      <SiteFooter />
      <MiniPlayer />
    </AudioPlayerProvider>
  );
}
