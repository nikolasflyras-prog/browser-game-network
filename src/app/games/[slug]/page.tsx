import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameDiscovery } from "@/components/catalog/GameDiscovery";
import { GameHost } from "@/components/game/GameHost";
import { RunTheFed } from "@/components/game/RunTheFed";
import { getGameMetadata, gameRegistry } from "@/games/registry";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return gameRegistry.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) return {};
  return { title: game.title, description: game.description };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) notFound();

  let heading = "What this page proves";
  let copy = "The diagnostic scene is a Phase 0 engineering surface. It validates lazy Phaser loading, responsive canvas behavior, input mapping, lifecycle cleanup, local persistence, and gameplay analytics without spending time on production art.";

  if (game.slug === "orbit-relay") {
    heading = "How to play";
    copy = "Your yellow marker circles the white source body. Tap, click, or press Space to launch along the faint tangent line. Hit the red relay before you leave the playfield. Every capture creates a new relay, raises your multiplier, speeds up the orbit, and tightens the capture window.";
  }

  if (game.slug === "linebreak-daily") {
    heading = "How to play";
    copy = "Start at S and draw one continuous route through neighboring cells. Pick up K before crossing G, avoid the red blocked cells, and reach E before you use all of the daily ink. Drag across cells or tap them one at a time. Move back one cell along your route to undo without restarting.";
  }

  if (game.slug === "run-the-fed") {
    heading = "What you are learning";
    copy = "Monetary policy works through tradeoffs and lags. A higher policy rate tends to cool demand, inflation, investment, and asset prices while increasing unemployment risk. A lower rate supports activity but can add inflation pressure. Your job is not to maximize one number; it is to keep the whole system reasonably balanced as conditions change.";
  }

  return (
    <article className="game-page">
      <header className="game-heading">
        <div className="game-heading-meta">
          <p className="eyebrow">{game.lane}</p>
          <span className="category-label">{game.category}</span>
        </div>
        <h1>{game.title}</h1>
        <p>{game.description}</p>
      </header>
      {game.slug === "run-the-fed" ? <RunTheFed /> : <GameHost game={game} />}
      <section className="content-section">
        <h2>{heading}</h2>
        <p>{copy}</p>
      </section>
      <GameDiscovery game={game} />
    </article>
  );
}
