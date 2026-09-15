import type { Metadata } from "next";
import Link from "next/link";
import { GameCard } from "@/components/catalog/GameCard";
import { getGameMetadata, publicGameRegistry } from "@/games/registry";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default function HomePage() {
  const featuredGame = getGameMetadata("market-maker") ?? publicGameRegistry[0];

  return (
    <div className="page-shell">
      <section className="hero">
        <p className="eyebrow">Browser Game Network</p>
        <h1>Small games worth another run.</h1>
        <p className="hero-copy">
          Fast entertainment games and interactive simulations that teach through decisions, not quizzes. Open a game and start playing.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href={`/games/${featuredGame.slug}`}>
            Try {featuredGame.title}
          </Link>
          <Link className="button" href="/learn">
            Browse learning games
          </Link>
        </div>
      </section>

      <section className="featured-section" aria-labelledby="featured-game-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">New Learn release</p>
            <h2 id="featured-game-heading">Current release</h2>
          </div>
          <Link className="text-link" href="/learn">
            Learning games <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="game-grid single-card-grid">
          <GameCard game={featuredGame} />
        </div>
      </section>

      <section className="lane-grid" aria-label="Product lanes">
        <Link className="lane-card" href="/learn">
          <p className="eyebrow">Learn</p>
          <h2>Interactive education</h2>
          <p>Finance, economics, business, markets, supply chains, semiconductors, energy, and data through cause-and-effect systems.</p>
          <span className="text-link">Run a learning simulation →</span>
        </Link>
        <Link className="lane-card" href="/games">
          <p className="eyebrow">Play</p>
          <h2>Entertainment</h2>
          <p>Short-session arcade, puzzle, strategy, management, and daily games designed around replay.</p>
          <span className="text-link">Browse playable games →</span>
        </Link>
      </section>
    </div>
  );
}
