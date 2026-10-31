import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// DESIGN.md: Barlow Condensed for display and numbers, IBM Plex Sans for body.
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: "600" });
const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "LIMITLINE",
  description: "Beat your own limit, earn embers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
