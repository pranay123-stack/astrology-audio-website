import { Compass } from "lucide-react";
import { Starfield } from "@/components/layout/Starfield";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { KpChartApp } from "./KpChartApp";
import { KpDashboard } from "./KpDashboard";

/**
 * The KP pages: heading, then the dashboard (home: signed-in visitors' charts, otherwise the form),
 * every saved chart (all), the new-chart form (new) or one saved chart (id).
 */
export async function KpChartLayout({ id, view = "home" }: { id?: string; view?: "home" | "all" | "new" }) {
  const lang = await getLang();
  const t = getDict(lang).kp;
  return (
    <>
      {!id && (
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Compass className="h-6 w-6" aria-hidden />
            <p className="eyebrow">{t.eyebrow}</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro}</p>
        </div>
      </section>
      )}
      {/* Wider than other pages: the chart needs room for its degrees and lords, as in KP software. */}
      <section className="mx-auto w-full max-w-[1720px] px-4 py-10 sm:px-6 lg:px-8">
        {id ? <KpChartApp initialId={id} /> : view === "new" ? <KpChartApp /> : <KpDashboard view={view} />}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted">{t.credit}</p>
      </section>
    </>
  );
}
