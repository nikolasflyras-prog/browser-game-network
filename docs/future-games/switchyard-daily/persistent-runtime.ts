import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  isBetterSwitchyardDailyResult,
  switchyardDailyRecord,
  switchyardDailyStorageName,
  switchyardUtcDateKey,
  type StoredSwitchyardDailyResult,
} from "./daily";
import { mountSwitchyardPrototype } from "./runtime";

const GAME_SLUG = "switchyard-daily";
const SAVE_VERSION = 1;

function resultFromEvent(properties: Record<string, string | number | boolean | null | undefined>) {
  const score = properties.score;
  const strikes = properties.strikes;
  const won = properties.won;
  const sequence = properties.sequence;
  if (typeof score !== "number" || typeof strikes !== "number" || typeof won !== "boolean" || typeof sequence !== "string") {
    return null;
  }
  if (!/^[01]*$/.test(sequence)) return null;
  return {
    score,
    strikes,
    won,
    sequence: [...sequence].map((value) => value === "1"),
  } as const;
}

export function mountPersistedSwitchyardPrototype(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  const wrappedBridge: GameBridge = {
    ...bridge,
    emit(event, properties = {}) {
      if (event !== "daily_completed") {
        bridge.emit(event, properties);
        return;
      }

      const result = resultFromEvent(properties);
      if (!result) {
        bridge.emit(event, properties);
        return;
      }

      const dateKey = typeof properties.daily_id === "string" ? properties.daily_id : switchyardUtcDateKey();
      const storageName = switchyardDailyStorageName(dateKey);
      const next = switchyardDailyRecord(result);
      const current = readLocalGameValue<StoredSwitchyardDailyResult>(GAME_SLUG, storageName, SAVE_VERSION);
      const savedBest = isBetterSwitchyardDailyResult(current, next);
      if (savedBest) writeLocalGameValue(GAME_SLUG, storageName, SAVE_VERSION, next);

      bridge.emit(event, { ...properties, saved_best: savedBest });
    },
  };

  return mountSwitchyardPrototype(mount, wrappedBridge);
}
