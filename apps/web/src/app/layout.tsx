import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./nash.css";
import "./typography.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ButtonFx } from "../components/ButtonFx";
import { Web3Provider } from "../providers/Web3Provider";
import { ThemeProvider, THEME_INIT_SCRIPT } from "../providers/ThemeProvider";

// Absolute URL for social previews. Left unset, Next derives it on Vercel and relative paths are used elsewhere.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Nash Protocol | Credit & Leverage at Equilibrium",
    template: "%s | Nash Protocol",
  },
  description:
    "The credit and leverage layer for tokenized stocks and ETFs on Robinhood Chain. Isolated markets, aligned incentives, and clear rules.",
  applicationName: "Nash Protocol",
  openGraph: {
    type: "website",
    siteName: "Nash Protocol",
    title: "Nash Protocol | Credit & Leverage at Equilibrium",
    description:
      "Isolated lending markets and 1-click long and short trading for tokenized stocks on Robinhood Chain.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nash Protocol" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nash Protocol | Credit & Leverage at Equilibrium",
    description:
      "Isolated lending markets and 1-click long and short trading for tokenized stocks on Robinhood Chain.",
    images: ["/og.png"],
  },
};

// Dark is the default theme; ThemeProvider keeps this tag in step when the visitor switches.
export const viewport: Viewport = {
  themeColor: "#010101",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-mono-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-mono-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="bg-page text-fg min-h-screen flex flex-col font-sans selection:bg-accent selection:text-on-accent antialiased">
        <ThemeProvider>
          <Web3Provider>
            <ButtonFx />
            <Header />
            <main id="main" className="flex-1 w-full mx-auto pt-[var(--header-h)]">
              {children}
            </main>
            <Footer />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
