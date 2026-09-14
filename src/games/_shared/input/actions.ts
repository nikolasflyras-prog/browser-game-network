export type GameAction =
  | "confirm"
  | "cancel"
  | "pause"
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down"
  | "action-1";

export const defaultKeyMap: Readonly<Record<GameAction, readonly string[]>> = {
  confirm: ["SPACE", "ENTER"],
  cancel: ["ESC"],
  pause: ["P", "ESC"],
  "move-left": ["LEFT", "A"],
  "move-right": ["RIGHT", "D"],
  "move-up": ["UP", "W"],
  "move-down": ["DOWN", "S"],
  "action-1": ["SPACE"],
};
