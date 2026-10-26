"use client";

import { useEffect } from "react";

/**
 * After a new version is deployed, a tab opened earlier still runs the old JavaScript. Its next
 * navigation can ask for code files or server actions that no longer exist, which surfaces as an
 * error. These errors are cured by loading the page again, so do that once (not in a loop).
 */
const STALE = /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to find Server Action|older or newer deployment/i;
const KEY = "stale-deploy-reload";

export function isStaleDeployError(error: Error): boolean {
  return STALE.test(`${error.name} ${error.message}`);
}

export function useReloadOnStaleDeploy(error: Error) {
  useEffect(() => {
    if (!isStaleDeployError(error)) return;
    try {
      const last = Number(sessionStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < 60_000) return; // reloaded a moment ago: show the error instead
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      return; // no storage: cannot guard against a loop, so do not reload
    }
    window.location.reload();
  }, [error]);
}
