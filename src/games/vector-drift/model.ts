export type DriftDifficulty = {
  gateSpeed: number;
  spawnMs: number;
  gapWidth: number;
};

export type DriftGateSpec = {
  seed: number;
  gapCenter: number;
  gapWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nextRandom(seed: number) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function difficultyForScore(gatesCleared: number): DriftDifficulty {
  return {
    gateSpeed: 230 + Math.min(250, gatesCleared * 8),
    spawnMs: Math.max(420, 940 - gatesCleared * 18),
    gapWidth: Math.max(82, 154 - gatesCleared * 2.2),
  };
}

export function nextGate(seed: number, playfieldWidth: number, gatesCleared: number): DriftGateSpec {
  const difficulty = difficultyForScore(gatesCleared);
  const random = nextRandom(seed);
  const margin = difficulty.gapWidth / 2 + 34;
  const usable = Math.max(1, playfieldWidth - margin * 2);
  return {
    seed: random.seed,
    gapCenter: margin + random.value * usable,
    gapWidth: difficulty.gapWidth,
  };
}

export function circleHitsGate(
  playerX: number,
  playerY: number,
  playerRadius: number,
  gateY: number,
  gateHeight: number,
  gapCenter: number,
  gapWidth: number,
) {
  const verticalOverlap = Math.abs(playerY - gateY) <= playerRadius + gateHeight / 2;
  if (!verticalOverlap) return false;
  const gapLeft = gapCenter - gapWidth / 2;
  const gapRight = gapCenter + gapWidth / 2;
  return playerX - playerRadius < gapLeft || playerX + playerRadius > gapRight;
}

export function gateClearScore(currentScore: number, playerX: number, gapCenter: number, gapWidth: number) {
  const edgeDistance = gapWidth / 2 - Math.abs(playerX - gapCenter);
  const nearMissBonus = edgeDistance >= 0 && edgeDistance < 18 ? 5 : 0;
  return currentScore + 10 + nearMissBonus;
}

export function clampPlayerX(x: number, playfieldWidth: number, radius = 12) {
  return clamp(x, radius + 6, playfieldWidth - radius - 6);
}
