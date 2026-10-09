import sharp from "sharp";

/** Deterministic PRNG so regenerated covers are identical. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const glyphs: Record<string, string> = {
  sun: `<circle cx="300" cy="300" r="70" fill="url(#gold)"/>${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<line x1="${300 + Math.cos(a) * 95}" y1="${300 + Math.sin(a) * 95}" x2="${300 + Math.cos(a) * 140}" y2="${300 + Math.sin(a) * 140}" stroke="#f3d27a" stroke-width="8" stroke-linecap="round"/>`;
  }).join("")}`,
  moon: `<mask id="crescent"><rect width="600" height="600" fill="#fff"/><circle cx="350" cy="262" r="108" fill="#000"/></mask><circle cx="300" cy="300" r="120" fill="url(#gold)" mask="url(#crescent)"/>`,
  wheel: `<circle cx="300" cy="300" r="150" fill="none" stroke="#f3d27a" stroke-width="5"/><circle cx="300" cy="300" r="105" fill="none" stroke="#f3d27a" stroke-opacity=".6" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<line x1="${300 + Math.cos(a) * 105}" y1="${300 + Math.sin(a) * 105}" x2="${300 + Math.cos(a) * 150}" y2="${300 + Math.sin(a) * 150}" stroke="#f3d27a" stroke-width="3"/><circle cx="${300 + Math.cos(a + Math.PI / 12) * 128}" cy="${300 + Math.sin(a + Math.PI / 12) * 128}" r="6" fill="#f3d27a"/>`;
  }).join("")}<circle cx="300" cy="300" r="24" fill="url(#gold)"/>`,
  star: `<path d="M300 140 L338 258 L462 258 L362 330 L400 450 L300 376 L200 450 L238 330 L138 258 L262 258 Z" fill="url(#gold)"/>`,
  planet: `<circle cx="300" cy="300" r="95" fill="url(#gold)"/><ellipse cx="300" cy="300" rx="170" ry="42" fill="none" stroke="#f3d27a" stroke-width="8" transform="rotate(-18 300 300)"/>`,
  bat: `<g transform="rotate(-35 300 300)"><rect x="285" y="120" width="30" height="110" rx="10" fill="#f3d27a"/><path d="M270 225 h60 l-6 230 a24 24 0 0 1 -48 0 z" fill="url(#gold)"/></g><circle cx="410" cy="420" r="34" fill="#c0392b"/><path d="M386 400 q24 20 48 40" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>`,
};

export async function renderCover(opts: { hue: number; glyph: string; label: string; seed: number }): Promise<Buffer> {
  const r = rng(opts.seed);
  const stars = Array.from({ length: 90 }, () => {
    const x = (r() * 600).toFixed(1);
    const y = (r() * 600).toFixed(1);
    const rad = (r() * 1.6 + 0.3).toFixed(2);
    const o = (r() * 0.7 + 0.2).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="#fff" opacity="${o}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <radialGradient id="bg" cx="35%" cy="30%" r="90%">
      <stop offset="0" stop-color="hsl(${opts.hue} 55% 32%)"/>
      <stop offset="0.55" stop-color="hsl(${(opts.hue + 20) % 360} 60% 14%)"/>
      <stop offset="1" stop-color="#070a1a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbe7a1"/><stop offset="1" stop-color="#c9971c"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  ${stars}
  ${glyphs[opts.glyph] ?? glyphs.star}
  <rect x="20" y="20" width="132" height="40" rx="20" fill="#000" fill-opacity=".45" stroke="#f3d27a" stroke-opacity=".7"/>
  <text x="86" y="47" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="700" fill="#f3d27a" text-anchor="middle" letter-spacing="3">${opts.label}</text>
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
}

/** Abstract placeholder portrait — deliberately not a photo of a person. */
export async function renderProfilePlaceholder(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#3b2470"/><stop offset="1" stop-color="#090c1f"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a1"/><stop offset="1" stop-color="#c9971c"/></linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="400" cy="320" r="120" fill="none" stroke="url(#g)" stroke-width="6"/>
  <path d="M190 690 C220 520 580 520 610 690" fill="none" stroke="url(#g)" stroke-width="6"/>
  <circle cx="400" cy="400" r="330" fill="none" stroke="#f3d27a" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 10"/>
  <text x="400" y="760" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#f3d27a" text-anchor="middle" letter-spacing="4">PHOTO PLACEHOLDER</text>
</svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}
