export type SkyPlatform = { id: number; x: number; y: number; width: number };
export type SkyboundState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  platforms: SkyPlatform[];
  seed: number;
  nextId: number;
  heightClimbed: number;
  score: number;
  landings: number;
  mode: "playing" | "gameover";
};
export type SkyboundEvent = "none" | "landed" | "game_over";

const PLAYER_RADIUS = 14;
const GRAVITY = 940;
const BOUNCE_SPEED = 520;

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function random(seed: number) { const next = (seed * 1103515245 + 12345) >>> 0; return { seed: next, value: next / 0xffffffff }; }

function nextPlatform(seed: number, id: number, y: number, width: number, heightClimbed: number): { seed: number; platform: SkyPlatform } {
  let r = random(seed);
  const platformWidth = Math.max(76, 150 - heightClimbed * 0.018);
  const margin = 24;
  const x = margin + r.value * Math.max(1, width - platformWidth - margin * 2);
  return { seed: r.seed, platform: { id, x, y, width: platformWidth } };
}

export function skyboundDifficulty(heightClimbed: number) {
  return {
    horizontalSpeed: 260 + Math.min(70, heightClimbed * 0.025),
    gapMin: 72 + Math.min(16, heightClimbed * 0.006),
    gapRange: 28 + Math.min(20, heightClimbed * 0.004),
  };
}

export function createSkyboundState(width: number, height: number, seed = 71): SkyboundState {
  const baseY = height * 0.82;
  const platforms: SkyPlatform[] = [{ id: 0, x: width * 0.5 - 95, y: baseY, width: 190 }];
  let currentSeed = seed >>> 0;
  let nextId = 1;
  let y = baseY;
  for (let index = 0; index < 9; index += 1) {
    let gapRoll = random(currentSeed); currentSeed = gapRoll.seed;
    const difficulty = skyboundDifficulty(index * 80);
    y -= difficulty.gapMin + gapRoll.value * difficulty.gapRange;
    const built = nextPlatform(currentSeed, nextId, y, width, index * 80);
    currentSeed = built.seed; platforms.push(built.platform); nextId += 1;
  }
  return {
    playerX: width * 0.5,
    playerY: baseY - PLAYER_RADIUS - 2,
    vx: 0,
    vy: -BOUNCE_SPEED,
    platforms,
    seed: currentSeed,
    nextId,
    heightClimbed: 0,
    score: 0,
    landings: 0,
    mode: "playing",
  };
}

function refillPlatforms(state: SkyboundState, width: number): Pick<SkyboundState, "platforms" | "seed" | "nextId"> {
  const platforms = state.platforms.filter((platform) => platform.y < 760);
  let seed = state.seed;
  let nextId = state.nextId;
  let highestY = platforms.length ? Math.min(...platforms.map((platform) => platform.y)) : 100;
  while (highestY > -130) {
    const difficulty = skyboundDifficulty(state.heightClimbed + Math.abs(highestY));
    const gapRoll = random(seed); seed = gapRoll.seed;
    highestY -= difficulty.gapMin + gapRoll.value * difficulty.gapRange;
    const built = nextPlatform(seed, nextId, highestY, width, state.heightClimbed + Math.abs(highestY));
    seed = built.seed; platforms.push(built.platform); nextId += 1;
  }
  return { platforms, seed, nextId };
}

export function advanceSkybound(state: SkyboundState, horizontalInput: number, deltaSeconds: number, width: number, height: number): { state: SkyboundState; event: SkyboundEvent } {
  if (state.mode === "gameover") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.04);
  const difficulty = skyboundDifficulty(state.heightClimbed);
  const input = clamp(horizontalInput, -1, 1);
  const targetVx = input * difficulty.horizontalSpeed;
  const vx = state.vx + (targetVx - state.vx) * Math.min(1, dt * 9);
  let playerX = clamp(state.playerX + vx * dt, PLAYER_RADIUS + 5, width - PLAYER_RADIUS - 5);
  const previousY = state.playerY;
  let vy = state.vy + GRAVITY * dt;
  let playerY = previousY + vy * dt;
  let landings = state.landings;
  let score = state.score;
  let event: SkyboundEvent = "none";

  if (vy > 0) {
    const previousBottom = previousY + PLAYER_RADIUS;
    const nextBottom = playerY + PLAYER_RADIUS;
    const candidates = state.platforms
      .filter((platform) => previousBottom <= platform.y + 2 && nextBottom >= platform.y && playerX >= platform.x - PLAYER_RADIUS * 0.55 && playerX <= platform.x + platform.width + PLAYER_RADIUS * 0.55)
      .sort((a, b) => a.y - b.y);
    const platform = candidates[0];
    if (platform) {
      playerY = platform.y - PLAYER_RADIUS;
      vy = -BOUNCE_SPEED;
      landings += 1;
      score += 18 + Math.min(52, landings * 2);
      event = "landed";
    }
  }

  let heightClimbed = state.heightClimbed;
  let platforms = state.platforms;
  let seed = state.seed;
  let nextId = state.nextId;
  const ceiling = height * 0.38;
  if (playerY < ceiling && vy < 0) {
    const scroll = ceiling - playerY;
    playerY = ceiling;
    heightClimbed += scroll;
    score += Math.floor(scroll * 0.7);
    platforms = platforms.map((platform) => ({ ...platform, y: platform.y + scroll }));
  }

  const refilled = refillPlatforms({ ...state, playerX, playerY, vx, vy, platforms, seed, nextId, heightClimbed, score, landings }, width);
  platforms = refilled.platforms; seed = refilled.seed; nextId = refilled.nextId;

  if (playerY > height + 55) {
    return { state: { ...state, playerX, playerY, vx: 0, vy: 0, platforms, seed, nextId, heightClimbed, score, landings, mode: "gameover" }, event: "game_over" };
  }

  return { state: { ...state, playerX, playerY, vx, vy, platforms, seed, nextId, heightClimbed, score, landings }, event };
}

export const skyboundPlayerRadius = PLAYER_RADIUS;
