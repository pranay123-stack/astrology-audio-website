import { describe, expect, it } from "vitest";
import { POPUP, popupDueAgain, popupIsLive, withPopupDefaults } from "@/content/popup";
import { siteContentSchemas } from "@/lib/site-content";

const diwali = { ...POPUP, enabled: true, title_en: "Diwali offer", text_en: "20% off KP charts this week.", button_en: "Book now", link: "/contact", version: "v1" };
const at = (iso: string) => Date.parse(iso);

describe("offer popup", () => {
  it("is off until switched on with a title", () => {
    expect(popupIsLive(POPUP, at("2026-11-06T10:00:00Z"))).toBe(false);
    expect(popupIsLive({ ...diwali, title_en: " " }, at("2026-11-06T10:00:00Z"))).toBe(false);
    expect(popupIsLive(diwali, at("2026-11-06T10:00:00Z"))).toBe(true);
  });

  it("shows only between its start and end", () => {
    const dated = { ...diwali, starts_at: "2026-11-08T00:00:00Z", ends_at: "2026-11-12T00:00:00Z" };
    expect(popupIsLive(dated, at("2026-11-07T23:59:00Z"))).toBe(false);
    expect(popupIsLive(dated, at("2026-11-10T12:00:00Z"))).toBe(true);
    expect(popupIsLive(dated, at("2026-11-12T00:01:00Z"))).toBe(false);
  });

  it("the bundled default passes the save checks", () => {
    expect(siteContentSchemas.popup.safeParse(POPUP).success).toBe(true);
    expect(siteContentSchemas.popup.safeParse(diwali).success).toBe(true);
  });

  it("refuses a switched-on popup without a title, dates the wrong way round, a button with nowhere to go and odd links", () => {
    const bad = (patch: object) => siteContentSchemas.popup.safeParse({ ...diwali, ...patch }).success;
    expect(bad({ title_en: "" })).toBe(false);
    expect(bad({ starts_at: "2026-11-12T00:00:00Z", ends_at: "2026-11-08T00:00:00Z" })).toBe(false);
    expect(bad({ link: "" })).toBe(false);
    expect(bad({ link: "javascript:alert(1)" })).toBe(false);
    expect(bad({ link: "//evil.example" })).toBe(false);
    expect(bad({ link: "https://wa.me/918961568049" })).toBe(true);
    expect(bad({ image_path: "../secret.png" })).toBe(false);
    expect(bad({ enabled: false, title_en: "" })).toBe(true);
  });

  it("shows again after the set wait, at once for a new offer, and never again when set to once", () => {
    const t0 = at("2026-11-06T10:00:00Z");
    const daily = { ...diwali, repeat_hours: 24 };
    expect(popupDueAgain(daily, null, t0)).toBe(true);
    expect(popupDueAgain(daily, { version: "v1", at: t0 }, t0 + 23 * 3_600_000)).toBe(false);
    expect(popupDueAgain(daily, { version: "v1", at: t0 }, t0 + 24 * 3_600_000)).toBe(true);
    expect(popupDueAgain(daily, { version: "old", at: t0 }, t0 + 60_000)).toBe(true);
    expect(popupDueAgain({ ...daily, repeat_hours: 0 }, { version: "v1", at: t0 }, t0 + 365 * 24 * 3_600_000)).toBe(false);
  });

  it("an offer saved before these settings existed gets the defaults", () => {
    const { delay_seconds, repeat_hours, ...old } = diwali;
    void delay_seconds;
    void repeat_hours;
    expect(withPopupDefaults(old)).toMatchObject({ delay_seconds: 15, repeat_hours: 24, title_en: "Diwali offer" });
  });
});
