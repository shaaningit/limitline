import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Nunito } from "next/font/google";
import "./globals.css";

// DESIGN.md: Barlow Condensed for display and numbers; Nunito, a rounded friendly face, for
// body and buttons (the Duolingo-style feel, founder Nov 1).
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"], weight: ["500", "700", "800"] });

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
