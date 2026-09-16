export type StackDifficulty = {
  speed: number;
  perfectTolerance: number;
};

export type StackDropResult = {
  hit: boolean;
  perfect: boolean;
  x: number;
  width: number;
  points: number;
};

export function stackDifficulty(level: number): StackDifficulty {
  const safeLevel = Math.max(0, level);
  return {
    speed: 175 + Math.min(285, safeLevel * 12),
    perfectTolerance: Math.max(2.5, 6 - safeLevel * 0.12),
  };
}

export function resolveStackDrop(
  baseX: number,
  baseWidth: number,
  movingX: number,
  movingWidth: number,
  level: number,
): StackDropResult {
  const difficulty = stackDifficulty(level);
  const offset = Math.abs(movingX - baseX);
  const perfect = offset <= difficulty.perfectTolerance;
  if (perfect) {
    const width = Math.min(baseWidth, movingWidth);
    return { hit: true, perfect: true, x: baseX, width, points: 30 + level * 2 };
  }

  const baseLeft = baseX - baseWidth / 2;
  const baseRight = baseX + baseWidth / 2;
  const movingLeft = movingX - movingWidth / 2;
  const movingRight = movingX + movingWidth / 2;
  const overlapLeft = Math.max(baseLeft, movingLeft);
  const overlapRight = Math.min(baseRight, movingRight);
  const overlap = overlapRight - overlapLeft;
  if (overlap <= 0) return { hit: false, perfect: false, x: movingX, width: 0, points: 0 };

  return {
    hit: true,
    perfect: false,
    x: (overlapLeft + overlapRight) / 2,
    width: overlap,
    points: 10 + level * 2,
  };
}

export function stackSpawnX(direction: 1 | -1, blockWidth: number, playfieldWidth: number) {
  const inset = blockWidth / 2 + 12;
  return direction === 1 ? inset : Math.max(inset, playfieldWidth - inset);
}
