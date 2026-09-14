import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import "./fed.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Browser Game Network home">
            BGN
          </Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/games">Play</Link>
            <Link href="/learn">Learn</Link>
            <Link href="/daily">Daily</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <span>Browser Game Network</span>
          <nav className="site-nav footer-nav" aria-label="Footer navigation">
            <Link href="/games">Play</Link>
            <Link href="/learn">Learn</Link>
            <Link href="/daily">Daily</Link>
          </nav>
          <span>Fast games. Clear systems. No account required.</span>
        </footer>
      </body>
    </html>
  );
}
