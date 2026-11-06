/** The offer popup shown to visitors (e.g. a Diwali or BBL offer). Off until set up in Admin. */
export interface PopupContent {
  enabled: boolean;
  title_en: string;
  title_hi: string;
  text_en: string;
  text_hi: string;
  /** Picture in the public images bucket (covers/…), or null for none. */
  image_path: string | null;
  button_en: string;
  button_hi: string;
  /** Where the button goes: a page of this site ("/contact") or a full link (https://…). */
  link: string;
  /** Shown from / until these instants (ISO-8601); "" = no limit. */
  starts_at: string;
  ends_at: string;
  /** Seconds a visitor spends on the site, across pages, before it appears. */
  delay_seconds: number;
  /** Hours after closing before it shows again; 0 = never again (until a new offer is saved). */
  repeat_hours: number;
  /** Changes on every save, so a visitor who closed the old offer sees the new one. */
  version: string;
}

export const POPUP_DELAYS = [5, 15, 30, 60, 120] as const;
export const POPUP_REPEATS = [0, 1, 24, 72, 168] as const;

export const POPUP: PopupContent = {
  enabled: false,
  title_en: "",
  title_hi: "",
  text_en: "",
  text_hi: "",
  image_path: null,
  button_en: "",
  button_hi: "",
  link: "",
  starts_at: "",
  ends_at: "",
  delay_seconds: 15,
  repeat_hours: 24,
  version: "",
};

/** A saved popup with any settings added since it was saved filled in. */
export const withPopupDefaults = (p: Partial<PopupContent>): PopupContent => ({ ...POPUP, ...p });

/** What a visitor's browser remembers about the offer they closed. */
export interface PopupClosed {
  version: string;
  at: number;
}

/** Whether this visitor should see it again: a new offer, or the wait after closing is over. */
export function popupDueAgain(p: PopupContent, closed: PopupClosed | null, now: number): boolean {
  if (!closed || closed.version !== p.version) return true;
  return p.repeat_hours > 0 && now - closed.at >= p.repeat_hours * 3_600_000;
}

/** Whether the popup should show at `now`: switched on, with a title, inside its dates. */
export function popupIsLive(p: PopupContent, now: number): boolean {
  if (!p.enabled || !p.title_en.trim()) return false;
  if (p.starts_at && now < Date.parse(p.starts_at)) return false;
  if (p.ends_at && now > Date.parse(p.ends_at)) return false;
  return true;
}
