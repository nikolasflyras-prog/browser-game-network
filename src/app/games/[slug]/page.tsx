import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameHost } from "@/components/game/GameHost";
import { getGameMetadata, gameRegistry } from "@/games/registry";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return gameRegistry.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) return {};
  return {
    title: game.title,
    description: game.description,
  };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) notFound();

  return (
    <article className="game-page">
      <header className="game-heading">
        <p className="eyebrow">{game.lane}</p>
        <h1>{game.title}</h1>
        <p>{game.description}</p>
      </header>

      <GameHost game={game} />

      <section className="content-section">
        <h2>What this page proves</h2>
        <p>
          The diagnostic scene is a Phase 0 engineering surface. It validates lazy Phaser loading, responsive canvas behavior, input mapping, lifecycle cleanup, local persistence, and gameplay analytics without spending time on production art.
        </p>
      </section>
    </article>
  );
}
