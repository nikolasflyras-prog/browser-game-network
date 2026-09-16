export type ReboundDifficulty = {
  ballSpeed: number;
  paddleWidth: number;
  rows: number;
};

export type Velocity = { vx: number; vy: number };
export type BrickSeed = { column: number; row: number; strength: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function reboundDifficulty(wave: number): ReboundDifficulty {
  const safeWave = Math.max(1, wave);
  return {
    ballSpeed: 285 + Math.min(210, (safeWave - 1) * 22),
    paddleWidth: Math.max(92, 154 - (safeWave - 1) * 6),
    rows: Math.min(6, 2 + Math.floor((safeWave - 1) / 2)),
  };
}

export function reflectFromPaddle(ballX: number, paddleX: number, paddleWidth: number, speed: number): Velocity {
  const offset = clamp((ballX - paddleX) / Math.max(1, paddleWidth / 2), -1, 1);
  const vx = speed * offset * 0.78;
  const vy = -Math.sqrt(Math.max(1, speed * speed - vx * vx));
  return { vx, vy };
}

export function brickPattern(wave: number, columns = 8): BrickSeed[] {
  const difficulty = reboundDifficulty(wave);
  const bricks: BrickSeed[] = [];
  for (let row = 0; row < difficulty.rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const skip = wave > 2 && (column + row + wave) % 7 === 0;
      if (!skip) bricks.push({ column, row, strength: wave >= 5 && (column + row) % 5 === 0 ? 2 : 1 });
    }
  }
  return bricks;
}

export function reboundHitScore(combo: number, strength = 1) {
  return 10 * strength + Math.min(30, Math.max(0, combo) * 2);
}
