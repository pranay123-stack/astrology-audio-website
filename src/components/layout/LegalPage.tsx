import { Starfield } from "./Starfield";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-3 text-5xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm text-muted">Last updated {updated}</p>
        </div>
      </section>
      <div className="container-page py-12">
        <div className="prose-cosmic max-w-3xl">{children}</div>
      </div>
    </>
  );
}

/** Shows the stored value, or a highlighted placeholder that the owner fills in from Admin → Profile. */
export function Fill({ value, placeholder }: { value: string; placeholder: string }) {
  return value ? (
    <>{value}</>
  ) : (
    <mark className="rounded bg-gold/20 px-1 text-gold-soft" title="Fill this in from Admin → Profile">
      [{placeholder}]
    </mark>
  );
}
