import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Hindi (Devanagari) articles: used automatically for Devanagari characters via the font stacks in globals.css.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-devanagari", display: "swap" });
const devanagariDisplay = Tiro_Devanagari_Hindi({ subsets: ["devanagari"], weight: "400", style: ["normal", "italic"], variable: "--font-devanagari-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Astrology Through Audio`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Listen to astrology audio: daily readings, horoscope insights, planetary transits, Vedic astrology and meditation, plus cricket astrology readings for the Big Bash League.",
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale.replace("-", "_"),
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#060818",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${devanagari.variable} ${devanagariDisplay.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
