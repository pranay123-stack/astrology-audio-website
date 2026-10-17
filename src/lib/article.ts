/**
 * Light article formatting for text the astrologer pastes in (often Hindi from WhatsApp):
 * blank line = new paragraph, "## " / "### " = heading, "- " or "• " = bullet, **bold**.
 * Parsed into a tree and rendered as React elements, so pasted text can never inject HTML.
 */
export type Inline = { text: string; bold: boolean };
export type Block =
  | { kind: "h2"; content: Inline[] }
  | { kind: "h3"; content: Inline[] }
  | { kind: "ul"; items: Inline[][] }
  | { kind: "p"; lines: Inline[][] };

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out;
}

const BULLET = /^\s*(?:[-•*])\s+/;

export function parseArticle(source: string): Block[] {
  const blocks: Block[] = [];
  const chunks = source.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
    if (!lines.length) continue;
    const first = lines[0].trim();
    if (first.startsWith("### ") || first.startsWith("## ")) {
      const content = parseInline(first.replace(/^#{2,3}\s+/, ""));
      blocks.push(first.startsWith("### ") ? { kind: "h3", content } : { kind: "h2", content });
      lines.shift();
      if (!lines.length) continue;
    }
    if (lines.every((l) => BULLET.test(l))) {
      blocks.push({ kind: "ul", items: lines.map((l) => parseInline(l.replace(BULLET, ""))) });
    } else {
      blocks.push({ kind: "p", lines: lines.map((l) => parseInline(l.trim())) });
    }
  }
  return blocks;
}

/** Rough reading time in minutes (about 180 words per minute, at least 1). */
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
