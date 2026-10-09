import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name} — Astrology Through Audio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "radial-gradient(circle at 25% 20%, #3b2470 0%, #0c1230 55%, #060818 100%)",
          color: "#ece9f7",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#d4af37", textTransform: "uppercase" }}>Cricket astrology · Audio</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>Discover Astrology Through Audio</div>
        <div style={{ fontSize: 36, marginTop: 28, color: "#f3d27a" }}>{siteConfig.name}</div>
      </div>
    ),
    size,
  );
}
