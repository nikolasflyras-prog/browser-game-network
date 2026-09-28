export type DriftGateKind = "standard" | "weave" | "precision";

export type DriftDifficulty = {
  gateSpeed: number;
  spawnMs: number;
  gapWidth: number;
  kind: DriftGateKind;
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

export function driftGateProfile(kind: DriftGateKind) {
  if (kind === "weave") return { widthFactor: 0.94, scoreBonus: 6, moveAmplitude: 46 };
  if (kind === "precision") return { widthFactor: 0.76, scoreBonus: 12, moveAmplitude: 0 };
  return { widthFactor: 1, scoreBonus: 0, moveAmplitude: 0 };
}

export function nextGate(seed: number, playfieldWidth: number, gatesCleared: number): DriftGateSpec {
  const difficulty = difficultyForScore(gatesCleared);
  const centerRoll = nextRandom(seed);
  const kindRoll = nextRandom(centerRoll.seed);
  const kind: DriftGateKind = gatesCleared >= 4 && kindRoll.value < 0.24 ? "weave" : gatesCleared >= 6 && kindRoll.value > 0.8 ? "precision" : "standard";
  const profile = driftGateProfile(kind);
  const gapWidth = Math.max(68, difficulty.gapWidth * profile.widthFactor);
  const margin = gapWidth / 2 + 34 + (kind === "weave" ? profile.moveAmplitude : 0);
  const usable = Math.max(1, playfieldWidth - margin * 2);
  return {
    seed: kindRoll.seed,
    gapCenter: margin + centerRoll.value * usable,
    gapWidth,
    kind,
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

export function gateClearScore(currentScore: number, playerX: number, gapCenter: number, gapWidth: number, kind: DriftGateKind = "standard") {
  const edgeDistance = gapWidth / 2 - Math.abs(playerX - gapCenter);
  const nearMissBonus = edgeDistance >= 0 && edgeDistance < 18 ? 5 : 0;
  return currentScore + 10 + nearMissBonus + driftGateProfile(kind).scoreBonus;
}

export function clampPlayerX(x: number, playfieldWidth: number, radius = 12) {
  return clamp(x, radius + 6, playfieldWidth - radius - 6);
}
