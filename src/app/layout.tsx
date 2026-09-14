import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Browser Game Network",
    template: "%s | Browser Game Network",
  },
  description: "Fast browser games and interactive learning simulations.",
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
          <span>Phase 0 foundation</span>
          <span>Fast games. Clear systems. No account required.</span>
        </footer>
      </body>
    </html>
  );
}
