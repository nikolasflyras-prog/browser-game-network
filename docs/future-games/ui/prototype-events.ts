import type { GameEventName, GameEventProperties } from "@/games/_shared/types/runtime";

export type PrototypeEventSink = (event: GameEventName, properties?: GameEventProperties) => void;

export function prototypeMetricProperties(metrics: Record<string, number>): GameEventProperties {
  return Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      value,
    ]),
  );
}

export function compactPrototypeEvent(event: GameEventName, properties: GameEventProperties = {}) {
  const detail = Object.entries(properties)
    .slice(0, 4)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
  return detail ? `${event} · ${detail}` : event;
}
