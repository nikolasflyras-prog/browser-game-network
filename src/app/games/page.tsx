import Link from "next/link";
import { gameRegistry } from "@/games/registry";

export const metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Play</p>
      <h1>Game framework</h1>
      <p className="lede">Phase 0 contains only a diagnostic runtime. Production games are added after the shared foundation passes QA.</p>
      <div className="game-list">
        {gameRegistry.map((game) => (
          <Link className="game-row" href={`/games/${game.slug}`} key={game.slug}>
            <span>
              <strong>{game.title}</strong>
              <small>{game.description}</small>
            </span>
            <span className="status-chip">{game.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
