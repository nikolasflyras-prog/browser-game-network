export type GameMastery = {
  xp: number;
  sessions: number;
  completions: number;
};

export type DailyProgress = {
  date: string;
  sessions: number;
  completions: number;
  uniqueGames: string[];
};

export type PlayerProgression = {
  version: 1;
  xp: number;
  sessions: number;
  completions: number;
  playedGames: string[];
  mastery: Record<string, GameMastery>;
  achievements: string[];
  streak: number;
  lastPlayedDate: string | null;
  daily: DailyProgress;
};

export type ProgressionEventInput = {
  gameSlug: string;
  event: string;
  properties?: Record<string, unknown>;
  dateKey?: string;
};

export type DailyChallenge = {
  id: string;
  label: string;
  current: number;
  target: number;
  completed: boolean;
};

export type ProgressionUpdateDetail = {
  state: PlayerProgression;
  unlocked: string[];
  gameSlug: string;
  event: string;
};

export const PLAYER_PROGRESSION_KEY = "bgn:player-progression:v1";
export const PLAYER_PROGRESSION_EVENT = "bgn:player-progression-updated";

export const ACHIEVEMENTS = {
  firstRun: { id: "first-run", label: "First Run" },
  finisher: { id: "finisher", label: "Finisher" },
  explorer: { id: "explorer", label: "Explorer" },
  specialist: { id: "specialist", label: "Specialist" },
  streaker: { id: "three-day-streak", label: "Three-Day Streak" },
  veteran: { id: "veteran", label: "Veteran" },
} as const;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function emptyDaily(date = localDateKey()): DailyProgress {
  return { date, sessions: 0, completions: 0, uniqueGames: [] };
}

export function emptyProgression(date = localDateKey()): PlayerProgression {
  return {
    version: 1,
    xp: 0,
    sessions: 0,
    completions: 0,
    playedGames: [],
    mastery: {},
    achievements: [],
    streak: 0,
    lastPlayedDate: null,
    daily: emptyDaily(date),
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

export function dailyChallenges(state: PlayerProgression, dateKey = localDateKey()): DailyChallenge[] {
  const daily = state.daily.date === dateKey ? state.daily : emptyDaily(dateKey);
  return [
    { id: "show-up", label: "Play one game", current: daily.sessions, target: 1, completed: daily.sessions >= 1 },
    { id: "finish-run", label: "Finish one run", current: daily.completions, target: 1, completed: daily.completions >= 1 },
    { id: "cross-train", label: "Play two different games", current: daily.uniqueGames.length, target: 2, completed: daily.uniqueGames.length >= 2 },
  ];
}

export function readProgression(storage: Pick<Storage, "getItem"> | null | undefined, dateKey = localDateKey()): PlayerProgression {
  if (!storage) return emptyProgression(dateKey);
  try {
    const raw = storage.getItem(PLAYER_PROGRESSION_KEY);
    if (!raw) return emptyProgression(dateKey);
    const parsed = JSON.parse(raw) as Partial<PlayerProgression>;
    if (parsed.version !== 1) return emptyProgression(dateKey);
    const parsedDaily = parsed.daily && typeof parsed.daily === "object" ? parsed.daily as Partial<DailyProgress> : null;
    return {
      version: 1,
      xp: Number(parsed.xp ?? 0),
      sessions: Number(parsed.sessions ?? 0),
      completions: Number(parsed.completions ?? 0),
      playedGames: Array.isArray(parsed.playedGames) ? parsed.playedGames.filter((value): value is string => typeof value === "string") : [],
      mastery: parsed.mastery && typeof parsed.mastery === "object" ? parsed.mastery as Record<string, GameMastery> : {},
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter((value): value is string => typeof value === "string") : [],
      streak: Number(parsed.streak ?? 0),
      lastPlayedDate: typeof parsed.lastPlayedDate === "string" ? parsed.lastPlayedDate : null,
      daily: parsedDaily?.date === dateKey
        ? {
            date: dateKey,
            sessions: Number(parsedDaily.sessions ?? 0),
            completions: Number(parsedDaily.completions ?? 0),
            uniqueGames: Array.isArray(parsedDaily.uniqueGames) ? parsedDaily.uniqueGames.filter((value): value is string => typeof value === "string") : [],
          }
        : emptyDaily(dateKey),
    };
  } catch {
    return emptyProgression(dateKey);
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
  if (state.streak >= 3) unlocked.add(ACHIEVEMENTS.streaker.id);
  if (state.sessions >= 20) unlocked.add(ACHIEVEMENTS.veteran.id);
  return [...unlocked];
}

export function progressionXpForEvent(event: string, properties?: Record<string, unknown>) {
  if (event === "game_started") return 5;
  if (event === "level_completed") return 20;
  if (event === "game_completed" || event === "game_over") return 25;
  if (event === "game_action" && typeof properties?.action === "string") return 3;
  return 0;
}

export function progressionAwardKey(event: string, properties?: Record<string, unknown>) {
  if (event === "game_action") return `action:${String(properties?.action ?? "generic")}`;
  if (event === "level_completed") return `level:${String(properties?.action ?? properties?.level ?? "complete")}`;
  return event;
}

function updateDaily(state: PlayerProgression, input: ProgressionEventInput, isStarted: boolean, isCompletion: boolean) {
  const dateKey = input.dateKey ?? localDateKey();
  const daily = state.daily.date === dateKey ? state.daily : emptyDaily(dateKey);
  const uniqueGames = isStarted && !daily.uniqueGames.includes(input.gameSlug) ? [...daily.uniqueGames, input.gameSlug] : daily.uniqueGames;
  let streak = state.streak;
  let lastPlayedDate = state.lastPlayedDate;

  if (isStarted && state.lastPlayedDate !== dateKey) {
    streak = state.lastPlayedDate === previousDateKey(dateKey) ? Math.max(1, state.streak + 1) : 1;
    lastPlayedDate = dateKey;
  }

  return {
    streak,
    lastPlayedDate,
    daily: {
      date: dateKey,
      sessions: daily.sessions + (isStarted ? 1 : 0),
      completions: daily.completions + (isCompletion ? 1 : 0),
      uniqueGames,
    },
  };
}

export function applyProgressionEvent(state: PlayerProgression, input: ProgressionEventInput) {
  const xpAward = progressionXpForEvent(input.event, input.properties);
  if (xpAward <= 0) return { state, xpAward: 0, unlocked: [] as string[] };

  const currentMastery = state.mastery[input.gameSlug] ?? { xp: 0, sessions: 0, completions: 0 };
  const isStarted = input.event === "game_started";
  const isCompletion = input.event === "game_completed" || input.event === "game_over" || input.event === "level_completed";
  const dailyUpdate = updateDaily(state, input, isStarted, isCompletion);
  const next: PlayerProgression = {
    ...state,
    ...dailyUpdate,
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
