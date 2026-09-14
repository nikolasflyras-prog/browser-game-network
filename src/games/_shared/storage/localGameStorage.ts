type VersionedRecord<T> = {
  version: number;
  value: T;
};

function keyFor(gameSlug: string, name: string) {
  return `bgn:${gameSlug}:${name}`;
}

export function readLocalGameValue<T>(gameSlug: string, name: string, version: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(gameSlug, name));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VersionedRecord<T>;
    return parsed.version === version ? parsed.value : null;
  } catch {
    return null;
  }
}

export function listLocalGameValues<T>(
  gameSlug: string,
  namePrefix: string,
  version: number,
): Array<{ name: string; value: T }> {
  if (typeof window === "undefined") return [];
  const prefix = keyFor(gameSlug, namePrefix);
  const values: Array<{ name: string; value: T }> = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(prefix)) continue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as VersionedRecord<T>;
      if (parsed.version !== version) continue;
      values.push({
        name: storageKey.slice(`bgn:${gameSlug}:`.length),
        value: parsed.value,
      });
    } catch {
      // Ignore malformed or stale local records and keep scanning.
    }
  }

  return values;
}

export function writeLocalGameValue<T>(gameSlug: string, name: string, version: number, value: T): void {
  if (typeof window === "undefined") return;
  const record: VersionedRecord<T> = { version, value };
  window.localStorage.setItem(keyFor(gameSlug, name), JSON.stringify(record));
}
