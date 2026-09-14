import Link from "next/link";
import type { GameMetadata } from "@/games/registry";

type Props = {
  game: GameMetadata;
  headingLevel?: "h2" | "h3";
};

export function GameCard({ game, headingLevel = "h2" }: Props) {
  const Heading = headingLevel;

  return (
    <article className="game-card">
      <div className="game-card-meta">
        <span className="eyebrow">{game.lane}</span>
        <span className="category-label">{game.category}</span>
      </div>
      <Heading>
        <Link href={`/games/${game.slug}`}>{game.title}</Link>
      </Heading>
      <p>{game.description}</p>
      <div className="game-card-footer">
        <span className="status-chip">{game.status}</span>
        <Link className="text-link" href={`/games/${game.slug}`}>
          Play now <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
