import type { Metadata } from "next";
import Link from "next/link";
import { GameCard } from "@/components/catalog/GameCard";
import { publicGameRegistry } from "@/games/registry";

export const metadata: Metadata = {
  title: "Interactive Learning Games",
  description: "Learn finance, semiconductors, business, infrastructure, and other systems by moving through playable environments and operating the system directly.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Interactive Learning Games",
    description: "Playable learning worlds for finance, semiconductors, business, infrastructure, and technical systems.",
    url: "/learn",
  },
};

export default function LearnPage() {
  const learnGames = publicGameRegistry.filter((game) => game.lane === "Learn");
  const semiconductorGames = learnGames.filter((game) => game.collection === "Semiconductors");

  return (
    <div className="page-shell">
      <section className="catalog-intro">
        <p className="eyebrow">Learn</p>
        <h1>Learn by living inside the system.</h1>
        <p className="lede">
          Move through offices, funds, factories, infrastructure, and technical systems. The lesson comes from
          operating the world under pressure—not from choosing an answer and reading a reaction.
        </p>
      </section>

      <section className="featured-section" aria-labelledby="semi-lane-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Dedicated collection</p>
            <h2 id="semi-lane-heading">Semiconductors</h2>
          </div>
          <Link className="text-link" href="/semiconductors">Enter semiconductor campus</Link>
        </div>
        <div className="game-grid">
          {semiconductorGames.map((game) => <GameCard game={game} key={game.slug} />)}
        </div>
      </section>

      <section aria-labelledby="learn-games-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Playable systems</p>
            <h2 id="learn-games-heading">All learning games</h2>
          </div>
          <span className="catalog-count">{learnGames.length} live</span>
        </div>
        <div className="game-grid">
          {learnGames.map((game) => <GameCard game={game} key={game.slug} />)}
        </div>
      </section>

      <section className="roadmap-panel" aria-labelledby="learn-method-heading">
        <div>
          <span className="status-chip">New Learn standard</span>
          <h2 id="learn-method-heading">Move → interact → manage → learn.</h2>
          <p>
            New Learn games are built as playable environments with movement, people, equipment, competing
            objectives, live events, persistent consequences, and multi-minute runs. Dashboards and reaction-button
            loops are no longer the target format.
          </p>
        </div>
        <p className="roadmap-note">
          Flagship directions: hedge fund and portfolio management, venture capital, startup operations,
          semiconductor design and manufacturing, data centers, infrastructure, and supply chains.
        </p>
      </section>

      <div className="page-actions">
        <Link className="button" href="/games">Browse all games</Link>
      </div>
    </div>
  );
}
