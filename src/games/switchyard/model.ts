export type SwitchLane = "left" | "center" | "right";

export type SwitchDifficulty = {
  spawnMs: number;
  progressPerSecond: number;
};

export type SwitchTrainSpec = {
  seed: number;
  lane: SwitchLane;
};

export type SwitchResolution = {
  correct: boolean;
  score: number;
  streak: number;
  lives: number;
};

const lanes: readonly SwitchLane[] = ["left", "center", "right"];

function nextRandom(seed: number) {
  const next = (seed * 22695477 + 1) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function switchDifficulty(resolved: number): SwitchDifficulty {
  const safe = Math.max(0, resolved);
  return {
    spawnMs: Math.max(680, 1500 - safe * 34),
    progressPerSecond: 0.22 + Math.min(0.19, safe * 0.006),
  };
}

export function nextSwitchTrain(seed: number): SwitchTrainSpec {
  const random = nextRandom(seed);
  return { seed: random.seed, lane: lanes[Math.min(2, Math.floor(random.value * 3))] };
}

export function resolveSwitchTrain(
  score: number,
  streak: number,
  lives: number,
  targetLane: SwitchLane,
  routedLane: SwitchLane,
): SwitchResolution {
  const correct = targetLane === routedLane;
  if (!correct) return { correct: false, score, streak: 0, lives: Math.max(0, lives - 1) };
  const nextStreak = streak + 1;
  return { correct: true, score: score + 12 + Math.min(36, nextStreak * 3), streak: nextStreak, lives };
}

export function laneIndex(lane: SwitchLane) {
  return lanes.indexOf(lane);
}

export function laneFromIndex(index: number): SwitchLane {
  return lanes[(index + lanes.length) % lanes.length];
}
