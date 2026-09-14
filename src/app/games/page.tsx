import Link from "next/link";
import { getPublicGames } from "@/games/registry";

export const metadata = {
  title: "Games",
  description: "Play fast browser games built for short sessions and repeat runs.",
};

export default function GamesPage() {
  const games = getPublicGames();

  return (
    <div className="page-shell compact">
      <p className="eyebrow">Play</p>
      <h1>Games</h1>
      <p className="lede">Fast browser games built for short sessions, quick restarts, and another run. No account required.</p>
      <div className="game-list" aria-label="Playable games">
        {games.map((game) => (
          <Link className="game-row" href={`/games/${game.slug}`} key={game.slug}>
            <span>
              <strong>{game.title}</strong>
              <small>{game.description}</small>
            </span>
            <span className="game-row-meta">
              <span>{game.category}</span>
              <span className="status-chip">{game.status}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="directory-footer">
        <p>More games are added only after the core loop survives playtesting.</p>
        <Link className="text-link" href="/learn">See what we are building for Learn →</Link>
      </div>
    </div>
  );
}
