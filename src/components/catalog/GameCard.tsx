"use client";

import Link from "next/link";
import type { GameMetadata } from "@/games/registry";
import { captureGameEvent } from "@/lib/analytics/client";

type Props = {
  game: GameMetadata;
  headingLevel?: "h2" | "h3";
  sourceGameSlug?: string;
};

export function GameCard({ game, headingLevel = "h2", sourceGameSlug }: Props) {
  const Heading = headingLevel;

  function trackRelatedClick() {
    if (!sourceGameSlug) return;
    captureGameEvent("related_game_clicked", {
      game_slug: sourceGameSlug,
      related_game_slug: game.slug,
    });
  }

  return (
    <article className="game-card">
      <div className="game-card-meta">
        <span className="eyebrow">{game.lane}</span>
        <span className="category-label">{game.category}</span>
      </div>
      <Heading>
        <Link href={`/games/${game.slug}`} onClick={trackRelatedClick}>{game.title}</Link>
      </Heading>
      <p>{game.description}</p>
      <div className="game-card-footer">
        <span className="status-chip">{game.status}</span>
        <Link className="text-link" href={`/games/${game.slug}`} onClick={trackRelatedClick}>
          Play now <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
