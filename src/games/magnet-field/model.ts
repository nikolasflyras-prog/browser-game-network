export type MagnetParticleKind = "scrap" | "bomb";
export type MagnetParticle = { id: number; kind: MagnetParticleKind; x: number; y: number; vx: number; vy: number };
export type MagnetInput = { x: number; y: number; active: boolean };
export type MagnetEvent = "scrap" | "bomb" | "game_over" | "spawn";

export type MagnetState = {
  magnetX: number;
  magnetY: number;
  score: number;
  combo: number;
  lives: number;
  energy: number;
  elapsed: number;
  spawnTimer: number;
  seed: number;
  nextId: number;
  particles: MagnetParticle[];
  mode: "playing" | "gameover";
};

const FIELD_RADIUS = 175;
const CORE_RADIUS = 18;

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function random(seed: number) { const next = (seed * 1664525 + 1013904223) >>> 0; return { seed: next, value: next / 0xffffffff }; }

function spawnParticle(seed: number, id: number, width: number, height: number, elapsed: number): { seed: number; particle: MagnetParticle } {
  let r = random(seed); const edge = Math.floor(r.value * 4); r = random(r.seed); const position = 0.12 + r.value * 0.76; r = random(r.seed);
  const bombChance = Math.min(0.3, 0.14 + elapsed * 0.0025);
  const kind: MagnetParticleKind = r.value < bombChance ? "bomb" : "scrap";
  r = random(r.seed); const speed = 34 + r.value * 48 + Math.min(50, elapsed * 0.5);
  let x = width * position; let y = height * position; let vx = 0; let vy = 0;
  if (edge === 0) { x = 10; y = height * position; vx = speed; vy = (r.value - 0.5) * speed * 0.7; }
  else if (edge === 1) { x = width - 10; y = height * position; vx = -speed; vy = (r.value - 0.5) * speed * 0.7; }
  else if (edge === 2) { x = width * position; y = 10; vy = speed; vx = (r.value - 0.5) * speed * 0.7; }
  else { x = width * position; y = height - 10; vy = -speed; vx = (r.value - 0.5) * speed * 0.7; }
  return { seed: r.seed, particle: { id, kind, x, y, vx, vy } };
}

export function magnetDifficulty(elapsed: number) {
  return { spawnSeconds: Math.max(0.62, 1.45 - elapsed * 0.012), moveSpeed: 235 + Math.min(65, elapsed * 0.35) };
}

export function createMagnetState(width: number, height: number, seed = 17): MagnetState {
  let currentSeed = seed >>> 0;
  const particles: MagnetParticle[] = [];
  let nextId = 1;
  for (let index = 0; index < 9; index += 1) {
    const spawned = spawnParticle(currentSeed, nextId, width, height, index * 1.5);
    currentSeed = spawned.seed;
    particles.push(index < 2 ? { ...spawned.particle, kind: "bomb" } : spawned.particle);
    nextId += 1;
  }
  return { magnetX: width / 2, magnetY: height / 2, score: 0, combo: 0, lives: 3, energy: 100, elapsed: 0, spawnTimer: 1.2, seed: currentSeed, nextId, particles, mode: "playing" };
}

export function advanceMagnet(state: MagnetState, input: MagnetInput, deltaSeconds: number, width: number, height: number): { state: MagnetState; events: MagnetEvent[] } {
  if (state.mode === "gameover") return { state, events: [] };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const difficulty = magnetDifficulty(state.elapsed);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const magnetX = clamp(state.magnetX + nx * difficulty.moveSpeed * dt, CORE_RADIUS + 8, width - CORE_RADIUS - 8);
  const magnetY = clamp(state.magnetY + ny * difficulty.moveSpeed * dt, CORE_RADIUS + 8, height - CORE_RADIUS - 8);
  const fieldActive = input.active && state.energy > 0.5;
  const energy = clamp(state.energy + (fieldActive ? -25 : 15) * dt, 0, 100);
  const elapsed = state.elapsed + dt;
  const events: MagnetEvent[] = [];
  let score = state.score;
  let combo = state.combo;
  let lives = state.lives;
  const particles: MagnetParticle[] = [];

  for (const source of state.particles) {
    let { x, y, vx, vy } = source;
    if (fieldActive) {
      const dx = magnetX - x; const dy = magnetY - y; const d = Math.max(1, Math.hypot(dx, dy));
      if (d < FIELD_RADIUS) {
        const force = (1 - d / FIELD_RADIUS) * 510;
        vx += (dx / d) * force * dt;
        vy += (dy / d) * force * dt;
      }
    }
    vx *= 1 - Math.min(0.18, dt * 0.55);
    vy *= 1 - Math.min(0.18, dt * 0.55);
    x += vx * dt; y += vy * dt;
    if (x < 8) { x = 8; vx = Math.abs(vx); } else if (x > width - 8) { x = width - 8; vx = -Math.abs(vx); }
    if (y < 8) { y = 8; vy = Math.abs(vy); } else if (y > height - 8) { y = height - 8; vy = -Math.abs(vy); }
    if (Math.hypot(x - magnetX, y - magnetY) <= CORE_RADIUS + 5) {
      if (source.kind === "scrap") { combo += 1; score += 20 + Math.min(80, combo * 4); events.push("scrap"); }
      else { lives = Math.max(0, lives - 1); combo = 0; events.push(lives <= 0 ? "game_over" : "bomb"); }
      continue;
    }
    particles.push({ ...source, x, y, vx, vy });
  }

  if (lives <= 0) {
    return { state: { ...state, magnetX, magnetY, score, combo, lives: 0, energy, elapsed, particles, mode: "gameover" }, events };
  }

  let seed = state.seed; let nextId = state.nextId; let spawnTimer = state.spawnTimer - dt;
  if (spawnTimer <= 0 && particles.length < 30) {
    const spawned = spawnParticle(seed, nextId, width, height, elapsed);
    seed = spawned.seed; nextId += 1; particles.push(spawned.particle); events.push("spawn");
    spawnTimer = magnetDifficulty(elapsed).spawnSeconds;
  }

  return { state: { ...state, magnetX, magnetY, score, combo, lives, energy, elapsed, spawnTimer, seed, nextId, particles }, events };
}

export const magnetFieldRadius = FIELD_RADIUS;
export const magnetCoreRadius = CORE_RADIUS;
