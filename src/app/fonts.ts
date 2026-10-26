import localFont from "next/font/local";

// Fonts are bundled with the site (./fonts, from Fontsource, SIL Open Font License — see
// fonts/LICENSES.txt) rather than fetched from Google Fonts at build time: a failed download
// there made a Hostinger build fail.

const display = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/cormorant-garamond-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
const sans = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
// Hindi (Devanagari): used automatically for Devanagari characters via the font stacks in globals.css.
const devanagari = localFont({
  src: "./fonts/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
});
const devanagariDisplay = localFont({
  src: [
    { path: "./fonts/tiro-devanagari-hindi-devanagari-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/tiro-devanagari-hindi-devanagari-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-devanagari-display",
  display: "swap",
});

/** Font CSS variables for the <html> element of each root layout. */
export const fontVariables = `${display.variable} ${sans.variable} ${devanagari.variable} ${devanagariDisplay.variable}`;
