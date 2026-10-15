import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./nash.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Web3Provider } from "../providers/Web3Provider";

// Absolute URL for social previews. Left unset, Next derives it on Vercel and relative paths are used elsewhere.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Nash Protocol | Credit & Leverage at Equilibrium",
    template: "%s | Nash Protocol",
  },
  description:
    "The credit and leverage layer for tokenized stocks and ETFs on Robinhood Chain. Isolated markets, aligned incentives, and positions that protect themselves.",
  applicationName: "Nash Protocol",
  openGraph: {
    type: "website",
    siteName: "Nash Protocol",
    title: "Nash Protocol | Credit & Leverage at Equilibrium",
    description:
      "Isolated lending markets, up to 2.5x leverage and Auto-Protect for tokenized assets on Robinhood Chain.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nash Protocol" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nash Protocol | Credit & Leverage at Equilibrium",
    description:
      "Isolated lending markets, up to 2.5x leverage and Auto-Protect for tokenized assets on Robinhood Chain.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/fonts/newsreader-roman.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/montserrat.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#000000] text-[#f5f5f5] min-h-screen flex flex-col font-sans selection:bg-[#e5e5e5] selection:text-[#000000] antialiased">
        <Web3Provider>
          <Header />
          <main id="main" className="flex-1 w-full mx-auto pt-[79px] min-[901px]:pt-[86px] min-[1051px]:pt-[100px]">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
