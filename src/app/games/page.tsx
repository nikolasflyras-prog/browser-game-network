import { GameCard } from "@/components/catalog/GameCard";
import { publicGameRegistry } from "@/games/registry";

export const metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <div className="page-shell">
      <div className="catalog-intro">
        <p className="eyebrow">Play</p>
        <h1>Pick a game and start.</h1>
        <p className="lede">
          Short browser games built for fast starts, clean controls, and another run. No account required.
        </p>
      </div>

      <div className="section-heading-row catalog-heading">
        <div>
          <p className="eyebrow">Available now</p>
          <h2>Game shelf</h2>
        </div>
        <span className="catalog-count">{publicGameRegistry.length} playable</span>
      </div>

      <div className="game-grid">
        {publicGameRegistry.map((game) => (
          <GameCard game={game} key={game.slug} />
        ))}
      </div>
    </div>
  );
}
