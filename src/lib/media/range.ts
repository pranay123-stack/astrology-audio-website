/**
 * Parses a single-range `Range: bytes=...` header against a file of `size` bytes.
 * Returns null when there is no usable header (serve the whole file), or
 * "unsatisfiable" when the range lies outside the file (respond 416).
 */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null | "unsatisfiable" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null; // multi-range or malformed: ignore and send the full body
  const [, startStr, endStr] = m;
  if (startStr === "" && endStr === "") return null;
  let start: number;
  let end: number;
  if (startStr === "") {
    const suffix = Number(endStr);
    if (suffix === 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startStr);
    end = endStr === "" ? size - 1 : Math.min(Number(endStr), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}
