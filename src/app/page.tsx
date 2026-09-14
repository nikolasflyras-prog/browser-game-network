import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="hero">
        <p className="eyebrow">Browser Game Network</p>
        <h1>Small games worth another run.</h1>
        <p className="hero-copy">
          One platform for fast entertainment games and interactive simulations that teach through decisions, not quizzes.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/games/orbit-relay">
            Play Orbit Relay
          </Link>
          <Link className="button" href="/games">
            Browse games
          </Link>
        </div>
      </section>

      <section className="lane-grid" aria-label="Product lanes">
        <article className="lane-card">
          <p className="eyebrow">Play</p>
          <h2>Entertainment</h2>
          <p>Short-session arcade, puzzle, strategy, management, and daily games designed around replay.</p>
        </article>
        <article className="lane-card">
          <p className="eyebrow">Learn</p>
          <h2>Interactive education</h2>
          <p>Finance, economics, business, accounting, markets, supply chains, history, geography, math, and data through cause-and-effect systems.</p>
        </article>
      </section>
    </div>
  );
}
