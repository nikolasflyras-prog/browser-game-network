export type GameLane = "Play" | "Learn";
export type GameStatus = "diagnostic" | "prototype" | "live";

export type GameMetadata = {
  slug: string;
  title: string;
  description: string;
  lane: GameLane;
  status: GameStatus;
  version: string;
};

export const gameRegistry: readonly GameMetadata[] = [
  {
    slug: "system-check",
    title: "System Check",
    description: "A Phase 0 diagnostic scene for the shared browser-game runtime.",
    lane: "Play",
    status: "diagnostic",
    version: "0.1.0",
  },
] as const;

export function getGameMetadata(slug: string): GameMetadata | undefined {
  return gameRegistry.find((game) => game.slug === slug);
}
