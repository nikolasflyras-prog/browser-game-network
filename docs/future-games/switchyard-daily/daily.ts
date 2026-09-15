export type SwitchyardDailyResult = {
  score: number;
  strikes: number;
  won: boolean;
  sequence: readonly boolean[];
};

export type StoredSwitchyardDailyResult = {
  score: number;
  strikes: number;
  won: boolean;
  sequence: string;
  completedAt: string;
};

export function switchyardUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function switchyardSeedFromDateKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function switchyardDailyStorageName(dateKey: string) {
  return `daily-${dateKey}`;
}

export function switchyardDailyRecord(result: SwitchyardDailyResult, completedAt = new Date().toISOString()): StoredSwitchyardDailyResult {
  return {
    score: result.score,
    strikes: result.strikes,
    won: result.won,
    sequence: result.sequence.map((correct) => (correct ? "1" : "0")).join(""),
    completedAt,
  };
}

export function isBetterSwitchyardDailyResult(current: StoredSwitchyardDailyResult | null, next: StoredSwitchyardDailyResult) {
  if (!current) return true;
  if (next.won !== current.won) return next.won;
  if (next.score !== current.score) return next.score > current.score;
  if (next.strikes !== current.strikes) return next.strikes < current.strikes;
  return false;
}

export function formatSwitchyardDailyShare(dateKey: string, result: SwitchyardDailyResult, streak = 0, url?: string) {
  const routeGrid = result.sequence.map((correct) => (correct ? "🟩" : "🟥")).join("");
  const correct = result.sequence.filter(Boolean).length;
  const lines = [
    `Switchyard Daily · ${dateKey}`,
    `${routeGrid} ${correct}/${result.sequence.length}`,
    `${result.score} pts · ${result.strikes} ${result.strikes === 1 ? "strike" : "strikes"}`,
  ];
  if (streak > 0) lines.push(`${streak}-day streak`);
  if (url) lines.push(url);
  return lines.join("\n");
}
