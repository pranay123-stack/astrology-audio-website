import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function GlobalNotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-page flex flex-col items-center gap-4 py-28 text-center">
        <p className="eyebrow">404</p>
        <h1 className="text-5xl font-semibold">This page has drifted out of orbit</h1>
        <p className="max-w-md text-muted">The page you are looking for does not exist.</p>
        <div className="flex gap-3">
          <Link href="/" className="btn-gold">Go home</Link>
          <Link href="/astrology-audios" className="btn-ghost">Browse audio</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
