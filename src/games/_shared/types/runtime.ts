export type GameEventName =
  | "game_viewed"
  | "game_started"
  | "game_paused"
  | "game_resumed"
  | "game_restarted"
  | "game_completed"
  | "game_over"
  | "level_started"
  | "level_completed"
  | "daily_started"
  | "daily_completed"
  | "share_clicked"
  | "related_game_clicked";

export type GameEventProperties = Record<string, string | number | boolean | null | undefined>;

export type GameBridge = {
  gameSlug: string;
  gameVersion: string;
  emit: (event: GameEventName, properties?: GameEventProperties) => void;
  setStatus: (status: string) => void;
};

export type GameRuntimeController = {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
};

export type GameRuntimeModule = {
  mountGame: (mount: HTMLElement, bridge: GameBridge) => Promise<GameRuntimeController> | GameRuntimeController;
};
