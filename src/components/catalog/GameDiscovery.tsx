import Link from "next/link";
import { GameCard } from "./GameCard";
import { getRelatedGames, type GameMetadata } from "@/games/registry";

type Props = {
  game: GameMetadata;
};

export function GameDiscovery({ game }: Props) {
  const related = getRelatedGames(game.slug);

  return (
    <section className="discovery-section" aria-labelledby="keep-playing-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Keep going</p>
          <h2 id="keep-playing-heading">{related.length ? "Related games" : "More from the network"}</h2>
        </div>
        <Link className="text-link" href="/games">
          Browse all games <span aria-hidden="true">→</span>
        </Link>
      </div>

      {related.length ? (
        <div className="game-grid">
          {related.map((relatedGame) => (
            <GameCard game={relatedGame} headingLevel="h3" key={relatedGame.slug} />
          ))}
        </div>
      ) : (
        <div className="discovery-grid">
          <Link className="discovery-link" href="/games">
            <span className="eyebrow">Play</span>
            <strong>Browse the game shelf</strong>
            <span>See every public game as the network grows.</span>
          </Link>
          <Link className="discovery-link" href="/learn">
            <span className="eyebrow">Learn</span>
            <strong>Interactive simulations</strong>
            <span>See what we are building beyond entertainment games.</span>
          </Link>
          <Link className="discovery-link" href="/daily">
            <span className="eyebrow">Daily</span>
            <strong>Return challenges</strong>
            <span>Follow the daily-game experiment before it launches.</span>
          </Link>
        </div>
      )}
    </section>
  );
}
