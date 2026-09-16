import { getGameSeoContent, type GameSeoContent } from "./gameSeo";
import { getExtraGameSeoContent } from "./gameSeoExtras";
import { getBatch7GameSeoContent } from "./gameSeoBatch7";

export function getAnyGameSeoContent(slug: string): GameSeoContent | undefined {
  return getGameSeoContent(slug) ?? getExtraGameSeoContent(slug) ?? getBatch7GameSeoContent(slug);
}
