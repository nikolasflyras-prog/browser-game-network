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

export function writeLocalGameValue<T>(gameSlug: string, name: string, version: number, value: T): void {
  if (typeof window === "undefined") return;
  const record: VersionedRecord<T> = { version, value };
  window.localStorage.setItem(keyFor(gameSlug, name), JSON.stringify(record));
}
