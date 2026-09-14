export function offsetDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date key: ${dateKey}`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function activeDailyStreak(completedDateKeys: readonly string[], todayKey: string): number {
  const completed = new Set(completedDateKeys);
  let cursor = completed.has(todayKey) ? todayKey : offsetDateKey(todayKey, -1);
  let streak = 0;

  while (completed.has(cursor)) {
    streak += 1;
    cursor = offsetDateKey(cursor, -1);
  }

  return streak;
}

export function formatDailyShare(
  dateKey: string,
  segments: number,
  inkLimit: number,
  streak: number,
  url: string,
): string {
  const spare = Math.max(0, inkLimit - segments);
  const lines = [
    `Linebreak Daily — ${dateKey}`,
    `${segments}/${inkLimit} ink · ${spare} spare`,
  ];
  if (streak > 0) lines.push(`🔥 ${streak}-day streak`);
  lines.push(url);
  return lines.join("\n");
}
