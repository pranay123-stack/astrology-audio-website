"use client";

import { isStaleDeployError, useReloadOnStaleDeploy } from "@/lib/stale-deploy";

/** Shown inside the admin shell when a page fails to load (for example, the database is unreachable). */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useReloadOnStaleDeploy(error);
  return (
    <div className="card space-y-3 p-8" role="alert">
      <h1 className="text-3xl font-semibold">This admin page could not load</h1>
      <p className="text-sm text-muted">
        The database or storage service may be temporarily unavailable. Your saved content is not affected. Try again, and if the
        problem continues check the site&apos;s health at <code className="text-ink">/api/health</code>.
      </p>
      {error.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
      <button type="button" onClick={() => (isStaleDeployError(error) ? window.location.reload() : reset())} className="btn-gold">
        Try again
      </button>
    </div>
  );
}
