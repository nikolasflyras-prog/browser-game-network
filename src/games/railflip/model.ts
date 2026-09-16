export type RailLane = "upper" | "lower";
export type RailDifficulty = { speed: number; spawnMs: number; obstacleWidth: number };
export type RailObstacleSpec = { seed: number; blockedLane: RailLane };

function nextRandom(seed: number) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function railDifficulty(passed: number): RailDifficulty {
  const safe = Math.max(0, passed);
  return {
    speed: 255 + Math.min(315, safe * 11),
    spawnMs: Math.max(560, 1280 - safe * 25),
    obstacleWidth: Math.min(64, 38 + safe * 0.7),
  };
}

export function nextRailObstacle(seed: number): RailObstacleSpec {
  const random = nextRandom(seed);
  return { seed: random.seed, blockedLane: random.value < 0.5 ? "upper" : "lower" };
}

export function flipLane(lane: RailLane): RailLane {
  return lane === "upper" ? "lower" : "upper";
}

export function railCollision(playerLane: RailLane, blockedLane: RailLane, obstacleX: number, playerX: number, obstacleWidth: number, playerRadius: number) {
  if (playerLane !== blockedLane) return false;
  return Math.abs(obstacleX - playerX) <= obstacleWidth / 2 + playerRadius;
}

export function railPassScore(score: number, streak: number) {
  return score + 10 + Math.min(30, Math.max(0, streak) * 2);
}
