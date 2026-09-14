import Link from "next/link";
import { gameRegistry } from "@/games/registry";

export const metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Play</p>
      <h1>Games</h1>
      <p className="lede">Fast browser games built on one shared runtime. Orbit Relay is the first playable prototype; System Check remains available as an engineering diagnostic.</p>
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
