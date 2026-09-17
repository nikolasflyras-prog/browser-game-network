import type { GameRuntimeModule } from "@/games/_shared/types/runtime";

const runtimeLoaders: Record<string, () => Promise<GameRuntimeModule>> = {
  "linebreak-daily": () => import("@/games/linebreak-daily/runtime"),
  "orbit-relay": () => import("@/games/orbit-relay/runtime"),
  "vector-drift": () => import("@/games/vector-drift/runtime"),
  "pulse-bloom": () => import("@/games/pulse-bloom/runtime"),
  "stackline": () => import("@/games/stackline/runtime"),
  "switchyard": () => import("@/games/switchyard/runtime"),
  "rebound-rush": () => import("@/games/rebound-rush/runtime"),
  "railflip": () => import("@/games/railflip/runtime"),
  "courier-loop": () => import("@/games/courier-loop/runtime"),
  "magnet-field": () => import("@/games/magnet-field/runtime"),
  "skybound": () => import("@/games/skybound/runtime"),
  "circuit-coil": () => import("@/games/circuit-coil/runtime"),
  "market-maker": () => import("@/games/market-maker-arcade/runtime"),
  "hedge-fund-floor": () => import("@/games/hedge-fund-floor/runtime-regimes-host"),
  "semiconductor-vc": () => import("@/games/semiconductor-vc/runtime"),
  "chip-architect": () => import("@/games/chip-architect/runtime"),
  "packaging-lab": () => import("@/games/packaging-lab/runtime"),
  "fab-floor": () => import("@/games/fab-floor/runtime-business"),
  "data-center-architect": () => import("@/games/data-center-architect/runtime"),
  "system-check": () => import("@/games/system-check/runtime"),
};

export async function loadGameRuntime(slug: string): Promise<GameRuntimeModule> {
  const loader = runtimeLoaders[slug];
  if (!loader) throw new Error(`No runtime registered for game: ${slug}`);
  return loader();
}
