/**
 * Google Drive file links ("Anyone with the link" sharing) that can be played on a post
 * through Drive's own embedded player.
 */
export interface DriveEmbed {
  fileId: string;
  /** iframe src */
  embedUrl: string;
  /** Opens the file in Google Drive. */
  viewUrl: string;
}

const FILE_ID = /^[A-Za-z0-9_-]{20,100}$/;

export function parseDriveLink(raw: string): DriveEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname.toLowerCase() !== "drive.google.com" && url.hostname.toLowerCase() !== "docs.google.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // /file/d/<id>/view, /file/u/0/d/<id>/view, /open?id=<id>, /uc?id=<id>
  const d = parts.indexOf("d");
  const id = parts[0] === "file" && d > 0 ? parts[d + 1] : ["open", "uc"].includes(parts[0] ?? "") ? url.searchParams.get("id") : null;
  if (!id || !FILE_ID.test(id)) return null;
  return {
    fileId: id,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    viewUrl: `https://drive.google.com/file/d/${id}/view`,
  };
}
