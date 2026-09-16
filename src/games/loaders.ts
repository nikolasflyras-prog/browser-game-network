import type { GameRuntimeModule } from "@/games/_shared/types/runtime";

const runtimeLoaders: Record<string, () => Promise<GameRuntimeModule>> = {
  "linebreak-daily": () => import("@/games/linebreak-daily/runtime"),
  "orbit-relay": () => import("@/games/orbit-relay/runtime"),
  "vector-drift": () => import("@/games/vector-drift/runtime"),
  "pulse-bloom": () => import("@/games/pulse-bloom/runtime"),
  "system-check": () => import("@/games/system-check/runtime"),
};

export async function loadGameRuntime(slug: string): Promise<GameRuntimeModule> {
  const loader = runtimeLoaders[slug];
  if (!loader) throw new Error(`No runtime registered for game: ${slug}`);
  return loader();
}
