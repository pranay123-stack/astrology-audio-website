import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center gap-4 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl font-semibold">This page has drifted out of orbit</h1>
      <p className="max-w-md text-muted">The page or episode you are looking for does not exist, or it is no longer published.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-gold">Go home</Link>
        <Link href="/astrology-audios" className="btn-ghost">Browse audio</Link>
      </div>
    </section>
  );
}
