import { getGameSeoContent, type GameSeoContent } from "./gameSeo";
import { getExtraGameSeoContent } from "./gameSeoExtras";
import { getBatch7GameSeoContent } from "./gameSeoBatch7";
import { getSemiconductorGameSeoContent } from "./gameSeoSemiconductors";
import { getFinanceGameSeoContent } from "./gameSeoFinance";
import { getFinanceRebuildGameSeoContent } from "./gameSeoFinanceRebuild";

export function getAnyGameSeoContent(slug: string): GameSeoContent | undefined {
  return getGameSeoContent(slug)
    ?? getExtraGameSeoContent(slug)
    ?? getBatch7GameSeoContent(slug)
    ?? getSemiconductorGameSeoContent(slug)
    ?? getFinanceRebuildGameSeoContent(slug)
    ?? getFinanceGameSeoContent(slug);
}
