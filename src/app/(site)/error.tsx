"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-page flex flex-col items-center gap-4 py-28 text-center" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="text-4xl font-semibold">We could not load this page</h1>
      <p className="max-w-md text-muted">Please try again. If the problem continues, come back a little later.</p>
      <button type="button" onClick={reset} className="btn-gold">Try again</button>
    </section>
  );
}
