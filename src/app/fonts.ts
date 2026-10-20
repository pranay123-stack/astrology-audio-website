import { Cormorant_Garamond, Inter, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Hindi (Devanagari): used automatically for Devanagari characters via the font stacks in globals.css.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-devanagari", display: "swap" });
const devanagariDisplay = Tiro_Devanagari_Hindi({ subsets: ["devanagari"], weight: "400", style: ["normal", "italic"], variable: "--font-devanagari-display", display: "swap" });

/** Font CSS variables for the <html> element of each root layout. */
export const fontVariables = `${display.variable} ${sans.variable} ${devanagari.variable} ${devanagariDisplay.variable}`;
