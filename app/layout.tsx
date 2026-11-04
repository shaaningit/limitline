import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";

// DESIGN.md (premium, Nov 4): Archivo, a wide athletic face, for headings, numbers and the
// wordmark (its width axis gives the Expanded cut); Manrope, a clean modern face, for text.
const display = Archivo({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });

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
