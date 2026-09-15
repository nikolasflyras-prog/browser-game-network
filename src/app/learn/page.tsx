import type { Metadata } from "next";
import Link from "next/link";
import { GameCard } from "@/components/catalog/GameCard";
import { publicGameRegistry } from "@/games/registry";

export const metadata: Metadata = {
  title: "Interactive Learning Games",
  description: "Learn economics, finance, business, and other systems through interactive browser simulations rather than quizzes.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Interactive Learning Games",
    description: "Learn economics, finance, business, and other systems through interactive browser simulations rather than quizzes.",
    url: "/learn",
  },
};

export default function LearnPage() {
  const learnGames = publicGameRegistry.filter((game) => game.lane === "Learn");

  return (
    <div className="page-shell">
      <section className="catalog-intro">
        <p className="eyebrow">Learn</p>
        <h1>Learn by running the system.</h1>
        <p className="lede">
          Make decisions inside economics, finance, business, and technical systems. The lesson is the cause-and-effect model itself—not a quiz after the fact.
        </p>
      </section>

      <section aria-labelledby="learn-games-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Live simulations</p>
            <h2 id="learn-games-heading">Interactive learning</h2>
          </div>
          <span className="catalog-count">{learnGames.length} live</span>
        </div>
        <div className="game-grid">
          {learnGames.map((game) => <GameCard game={game} key={game.slug} />)}
        </div>
      </section>

      <section className="roadmap-panel" aria-labelledby="learn-method-heading">
        <div>
          <span className="status-chip">How this lane works</span>
          <h2 id="learn-method-heading">Decision → response → explanation.</h2>
          <p>
            Each Learn game exposes a system you can operate. You make a real decision, see multiple variables respond, and learn why the tradeoff changed.
          </p>
        </div>
        <p className="roadmap-note">The network is prioritizing simulations in finance, operations, semiconductors, energy, markets, and other systems where cause and effect is more useful than memorization.</p>
      </section>

      <div className="page-actions">
        <Link className="button" href="/games">Browse all games</Link>
      </div>
    </div>
  );
}
