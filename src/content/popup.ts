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
  /** Changes on every save, so a visitor who closed the old offer sees the new one. */
  version: string;
}

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
  version: "",
};

/** Whether the popup should show at `now`: switched on, with a title, inside its dates. */
export function popupIsLive(p: PopupContent, now: number): boolean {
  if (!p.enabled || !p.title_en.trim()) return false;
  if (p.starts_at && now < Date.parse(p.starts_at)) return false;
  if (p.ends_at && now > Date.parse(p.ends_at)) return false;
  return true;
}
