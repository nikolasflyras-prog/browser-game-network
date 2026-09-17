export type GameMastery = {
  xp: number;
  sessions: number;
  completions: number;
};

export type PlayerProgression = {
  version: 1;
  xp: number;
  sessions: number;
  completions: number;
  playedGames: string[];
  mastery: Record<string, GameMastery>;
  achievements: string[];
};

export type ProgressionEventInput = {
  gameSlug: string;
  event: string;
  properties?: Record<string, unknown>;
};

export const PLAYER_PROGRESSION_KEY = "bgn:player-progression:v1";

export const ACHIEVEMENTS = {
  firstRun: { id: "first-run", label: "First Run" },
  finisher: { id: "finisher", label: "Finisher" },
  explorer: { id: "explorer", label: "Explorer" },
  specialist: { id: "specialist", label: "Specialist" },
  veteran: { id: "veteran", label: "Veteran" },
} as const;

export function emptyProgression(): PlayerProgression {
  return {
    version: 1,
    xp: 0,
    sessions: 0,
    completions: 0,
    playedGames: [],
    mastery: {},
    achievements: [],
  };
}

export function progressionLevel(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / 100) + 1);
}

export function masteryLevel(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / 75) + 1);
}

export function xpIntoCurrentLevel(xp: number) {
  return Math.max(0, xp) % 100;
}

export function readProgression(storage: Pick<Storage, "getItem"> | null | undefined): PlayerProgression {
  if (!storage) return emptyProgression();
  try {
    const raw = storage.getItem(PLAYER_PROGRESSION_KEY);
    if (!raw) return emptyProgression();
    const parsed = JSON.parse(raw) as Partial<PlayerProgression>;
    if (parsed.version !== 1) return emptyProgression();
    return {
      version: 1,
      xp: Number(parsed.xp ?? 0),
      sessions: Number(parsed.sessions ?? 0),
      completions: Number(parsed.completions ?? 0),
      playedGames: Array.isArray(parsed.playedGames) ? parsed.playedGames.filter((value): value is string => typeof value === "string") : [],
      mastery: parsed.mastery && typeof parsed.mastery === "object" ? parsed.mastery as Record<string, GameMastery> : {},
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter((value): value is string => typeof value === "string") : [],
    };
  } catch {
    return emptyProgression();
  }
}

export function writeProgression(storage: Pick<Storage, "setItem"> | null | undefined, state: PlayerProgression) {
  storage?.setItem(PLAYER_PROGRESSION_KEY, JSON.stringify(state));
}

function unlockAchievements(state: PlayerProgression) {
  const unlocked = new Set(state.achievements);
  if (state.sessions >= 1) unlocked.add(ACHIEVEMENTS.firstRun.id);
  if (state.completions >= 1) unlocked.add(ACHIEVEMENTS.finisher.id);
  if (state.playedGames.length >= 5) unlocked.add(ACHIEVEMENTS.explorer.id);
  if (Object.values(state.mastery).some((entry) => entry.xp >= 150)) unlocked.add(ACHIEVEMENTS.specialist.id);
  if (state.sessions >= 20) unlocked.add(ACHIEVEMENTS.veteran.id);
  return [...unlocked];
}

export function progressionXpForEvent(event: string, properties?: Record<string, unknown>) {
  if (event === "game_started") return 5;
  if (event === "level_completed") return 20;
  if (event === "game_over") return 25;
  if (event === "game_action" && typeof properties?.action === "string") return 3;
  return 0;
}

export function progressionAwardKey(event: string, properties?: Record<string, unknown>) {
  if (event === "game_action") return `action:${String(properties?.action ?? "generic")}`;
  if (event === "level_completed") return `level:${String(properties?.action ?? properties?.level ?? "complete")}`;
  return event;
}

export function applyProgressionEvent(state: PlayerProgression, input: ProgressionEventInput) {
  const xpAward = progressionXpForEvent(input.event, input.properties);
  if (xpAward <= 0) return { state, xpAward: 0, unlocked: [] as string[] };

  const currentMastery = state.mastery[input.gameSlug] ?? { xp: 0, sessions: 0, completions: 0 };
  const isStarted = input.event === "game_started";
  const isCompletion = input.event === "game_over" || input.event === "level_completed";
  const next: PlayerProgression = {
    ...state,
    xp: state.xp + xpAward,
    sessions: state.sessions + (isStarted ? 1 : 0),
    completions: state.completions + (isCompletion ? 1 : 0),
    playedGames: state.playedGames.includes(input.gameSlug) ? state.playedGames : [...state.playedGames, input.gameSlug],
    mastery: {
      ...state.mastery,
      [input.gameSlug]: {
        xp: currentMastery.xp + xpAward,
        sessions: currentMastery.sessions + (isStarted ? 1 : 0),
        completions: currentMastery.completions + (isCompletion ? 1 : 0),
      },
    },
  };
  const previous = new Set(state.achievements);
  next.achievements = unlockAchievements(next);
  return {
    state: next,
    xpAward,
    unlocked: next.achievements.filter((id) => !previous.has(id)),
  };
}

export function achievementLabel(id: string) {
  return Object.values(ACHIEVEMENTS).find((achievement) => achievement.id === id)?.label ?? id;
}
