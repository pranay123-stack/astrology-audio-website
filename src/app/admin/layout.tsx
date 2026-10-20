import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import { baseMetadata } from "../root-metadata";
import "../globals.css";

export { viewport } from "../root-metadata";

export const metadata: Metadata = {
  ...baseMetadata,
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Root layout of the admin area (English only). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-b from-navy to-night">{children}</div>
      </body>
    </html>
  );
}
