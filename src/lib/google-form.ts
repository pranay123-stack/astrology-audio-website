/**
 * The astrologer's Google Form (a questionnaire for people who want to learn cricket
 * astrology). Full docs.google.com/forms links are embedded on the contact page; a short
 * forms.gle link cannot be framed reliably, so it is shown as a button instead.
 */
export interface GoogleForm {
  /** iframe src, or null when the form can only be opened in a new tab. */
  embedUrl: string | null;
  openUrl: string;
}

export function parseGoogleForm(raw: string): GoogleForm | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "forms.gle") {
    return /^\/[A-Za-z0-9]{6,40}$/.test(url.pathname) ? { embedUrl: null, openUrl: url.toString() } : null;
  }
  if (host !== "docs.google.com") return null;
  // /forms/d/e/<public id>/viewform (shared link) or /forms/d/<id>/viewform
  const m = /^\/forms(?:\/u\/\d+)?\/d\/(e\/)?([A-Za-z0-9_-]{20,120})(?:\/(?:viewform|formResponse))?\/?$/.exec(url.pathname);
  if (!m) return null;
  const base = `https://docs.google.com/forms/d/${m[1] ?? ""}${m[2]}/viewform`;
  return { embedUrl: `${base}?embedded=true`, openUrl: base };
}
