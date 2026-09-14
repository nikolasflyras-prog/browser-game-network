import Link from "next/link";

export const metadata = { title: "Daily" };

export default function DailyPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Daily</p>
      <h1>One challenge. One reason to come back.</h1>
      <p className="lede">
        Daily games will use a shared challenge for everyone, a clean result worth sharing, and streak history stored locally without requiring an account.
      </p>

      <section className="roadmap-panel" aria-labelledby="daily-next-heading">
        <div>
          <span className="status-chip">Next experiment</span>
          <h2 id="daily-next-heading">Linebreak Daily</h2>
          <p>
            Draw one route through switches, keys, and hazards with limited ink. The same puzzle is served to every player each day.
          </p>
        </div>
        <p className="roadmap-note">This will test return behavior, streaks, and score sharing before we add accounts or leaderboards.</p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/orbit-relay">
          Play Orbit Relay
        </Link>
        <Link className="button" href="/games">
          Browse games
        </Link>
      </div>
    </div>
  );
}
