import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameEventProperties, GameRuntimeController } from "@/games/_shared/types/runtime";
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

function resultFromEvent(properties: GameEventProperties) {
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
  let startedAt = Date.now();

  const wrappedBridge: GameBridge = {
    ...bridge,
    emit(event, properties = {}) {
      if (event === "daily_started") {
        startedAt = Date.now();
        bridge.emit(event, properties);
        return;
      }

      if (event === "game_restarted") {
        startedAt = Date.now();
        bridge.emit(event, properties);
        return;
      }

      if (event === "game_action" && properties.action === "switchyard_route") {
        bridge.emit("level_completed", {
          turn: properties.turn,
          action: properties.switch_action,
          target: properties.target,
          actual: properties.actual,
          correct: properties.correct,
          strikes: properties.strikes,
        });
        bridge.emit(event, properties);
        return;
      }

      if (event !== "daily_completed") {
        bridge.emit(event, properties);
        return;
      }

      const enriched: GameEventProperties = {
        ...properties,
        duration_ms: Math.max(0, Date.now() - startedAt),
      };
      const result = resultFromEvent(enriched);
      if (!result) {
        bridge.emit(event, enriched);
        return;
      }

      const dailyId = enriched["daily_id"];
      const dateKey = typeof dailyId === "string" ? dailyId : switchyardUtcDateKey();
      const storageName = switchyardDailyStorageName(dateKey);
      const next = switchyardDailyRecord(result);
      const current = readLocalGameValue<StoredSwitchyardDailyResult>(GAME_SLUG, storageName, SAVE_VERSION);
      const savedBest = isBetterSwitchyardDailyResult(current, next);
      if (savedBest) writeLocalGameValue(GAME_SLUG, storageName, SAVE_VERSION, next);

      bridge.emit(event, { ...enriched, saved_best: savedBest });
    },
  };

  return mountSwitchyardPrototype(mount, wrappedBridge);
}
