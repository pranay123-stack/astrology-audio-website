import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/layout/Logo";
import { requireAdmin } from "@/lib/auth/admin";
import { getDataBackend } from "@/lib/config";

/**
 * The gate keeps the panel hidden from signed-out visitors. Every admin page and
 * server action still calls requireAdmin() itself, because layouts and pages render
 * independently and a layout check alone does not protect data.
 */
async function Gate({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <p className="mb-6 text-xs text-muted">
        Signed in as <span className="text-ink">{admin.email}</span> · {getDataBackend() === "local" ? "Local mode (data in .data/)" : "Supabase"}
      </p>
      {children}
    </>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      {/* min-w-0 lets the horizontally scrolling nav shrink on phones instead of widening the column. */}
      <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-xl font-semibold">Admin</span>
        </div>
        <Suspense>
          <AdminNav />
        </Suspense>
      </aside>
      <main id="main" className="min-w-0">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" />}>
          <Gate>{children}</Gate>
        </Suspense>
      </main>
    </div>
  );
}
