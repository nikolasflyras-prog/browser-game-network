export type Vec2 = { x: number; y: number };
export type PulseParticleSeed = Vec2 & { vx: number; vy: number };

export type PulseRoundConfig = {
  particleCount: number;
  target: number;
  maxPulseRadius: number;
  pulseDuration: number;
};

function nextRandom(seed: number) {
  const next = (seed * 1103515245 + 12345) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function roundConfig(round: number): PulseRoundConfig {
  const safeRound = Math.max(1, round);
  const particleCount = Math.min(30, 14 + safeRound * 2);
  return {
    particleCount,
    target: Math.min(particleCount - 2, 3 + safeRound * 2),
    maxPulseRadius: Math.max(38, 56 - safeRound * 1.5),
    pulseDuration: Math.max(0.95, 1.35 - safeRound * 0.025),
  };
}

export function pulseRadius(ageSeconds: number, durationSeconds: number, maxRadius: number) {
  if (ageSeconds <= 0 || ageSeconds >= durationSeconds) return 0;
  const progress = ageSeconds / durationSeconds;
  return Math.sin(Math.PI * progress) * maxRadius;
}

export function circlesOverlap(a: Vec2, aRadius: number, b: Vec2, bRadius: number) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = aRadius + bRadius;
  return dx * dx + dy * dy <= radius * radius;
}

export function roundScore(round: number, captured: number, target: number) {
  const clearBonus = captured >= target ? 40 + round * 15 : 0;
  return captured * captured * 4 + clearBonus;
}

export function particleSeeds(seed: number, count: number, width: number, height: number): PulseParticleSeed[] {
  let current = seed >>> 0;
  const particles: PulseParticleSeed[] = [];
  const margin = 34;
  for (let index = 0; index < count; index += 1) {
    const rx = nextRandom(current); current = rx.seed;
    const ry = nextRandom(current); current = ry.seed;
    const ra = nextRandom(current); current = ra.seed;
    const rs = nextRandom(current); current = rs.seed;
    const angle = ra.value * Math.PI * 2;
    const speed = 34 + rs.value * 42;
    particles.push({
      x: margin + rx.value * Math.max(1, width - margin * 2),
      y: 78 + ry.value * Math.max(1, height - 150),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return particles;
}
