import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daily Browser Puzzle",
  description: "Play Linebreak Daily: one shared route-planning browser puzzle each day, with no account required.",
  alternates: { canonical: "/daily" },
  openGraph: {
    title: "Daily Browser Puzzle",
    description: "Play Linebreak Daily: one shared route-planning browser puzzle each day, with no account required.",
    url: "/daily",
  },
};

export default function DailyPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Daily</p>
      <h1>One challenge. One reason to come back.</h1>
      <p className="lede">The same Linebreak puzzle is served to everyone each UTC day. Your completion and best ink use are stored locally, so the daily loop works without an account.</p>

      <section className="roadmap-panel" aria-labelledby="daily-live-heading">
        <div>
          <span className="status-chip">Playable prototype</span>
          <h2 id="daily-live-heading">Linebreak Daily</h2>
          <p>Draw one continuous route from start to exit, collect the key before crossing the gate, avoid blocked cells, and finish before your ink runs out.</p>
        </div>
        <p className="roadmap-note">This experiment tests daily return behavior and compact puzzle sharing before accounts, global streaks, or leaderboards.</p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/linebreak-daily">Play today&apos;s Linebreak</Link>
        <Link className="button" href="/games/orbit-relay">Play Orbit Relay</Link>
      </div>
    </div>
  );
}
