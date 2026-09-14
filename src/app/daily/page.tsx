import Link from "next/link";

export const metadata = {
  title: "Daily",
  description: "Daily browser-game experiments built around short sessions, streaks, and shareable results.",
};

export default function DailyPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Daily</p>
      <h1>A reason to come back tomorrow.</h1>
      <p className="lede">Daily challenges will test return behavior without forcing accounts. The first planned experiment is Linebreak Daily: one compact routing puzzle, the same challenge for everyone, with local streak history and a shareable result.</p>

      <section className="roadmap-section" aria-labelledby="daily-next-title">
        <p className="eyebrow">Next experiment</p>
        <h2 id="daily-next-title">Linebreak Daily</h2>
        <p>Draw one continuous route through switches, keys, and hazards with a limited path budget. Finish cleanly, compare solutions, and come back for the next seed.</p>
      </section>

      <div className="discovery-actions">
        <Link className="button primary" href="/games/orbit-relay">Play Orbit Relay</Link>
        <Link className="button" href="/games">Browse games</Link>
      </div>
    </div>
  );
}
