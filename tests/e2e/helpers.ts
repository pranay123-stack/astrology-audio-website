import type { Page } from "@playwright/test";

/** Navigates and waits until the page has hydrated, so form input is not overwritten by hydration. */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
