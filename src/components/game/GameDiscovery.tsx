import Link from "next/link";
import type { GameMetadata } from "@/games/registry";
import { getRelatedGames } from "@/games/registry";

type Props = {
  game: GameMetadata;
};

export function GameDiscovery({ game }: Props) {
  const related = getRelatedGames(game.slug);

  if (game.status === "diagnostic") {
    return (
      <section className="discovery-section" aria-labelledby="diagnostic-exit-title">
        <p className="eyebrow">Player site</p>
        <h2 id="diagnostic-exit-title">Done checking the runtime?</h2>
        <p>System Check stays available for engineering QA, but it is not part of the public game catalog.</p>
        <div className="discovery-actions">
          <Link className="button primary" href="/games">Browse playable games</Link>
          <Link className="button" href="/">Back home</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="discovery-section" aria-labelledby="play-next-title">
      <p className="eyebrow">Keep playing</p>
      <h2 id="play-next-title">{related.length ? "Play next" : "More games are on the way."}</h2>
      {related.length ? (
        <div className="related-list">
          {related.map((relatedGame) => (
            <Link className="related-row" href={`/games/${relatedGame.slug}`} key={relatedGame.slug}>
              <span>
                <strong>{relatedGame.title}</strong>
                <small>{relatedGame.description}</small>
              </span>
              <span>{relatedGame.category} →</span>
            </Link>
          ))}
        </div>
      ) : (
        <p>Orbit Relay is the first public playable. New games will appear here automatically as they clear the same playtest and QA gates.</p>
      )}
      <div className="discovery-actions">
        <Link className="button primary" href="/games">Browse games</Link>
        <Link className="button" href={game.lane === "Play" ? "/learn" : "/games"}>
          {game.lane === "Play" ? "Explore Learn" : "Play something"}
        </Link>
      </div>
    </section>
  );
}
