export type Vec2 = { x: number; y: number };
export type Bounds = { width: number; height: number };

export type OrbitRelayDifficulty = {
  orbitRadius: number;
  orbitSpeed: number;
  launchSpeed: number;
  targetRadius: number;
  targetMotionAmplitude: number;
  targetMotionSpeed: number;
};

export type OrbitRelayScore = {
  relays: number;
  score: number;
  multiplier: number;
};

export function difficultyForRelay(relays: number): OrbitRelayDifficulty {
  const safeRelays = Math.max(0, relays);
  return {
    orbitRadius: Math.max(54, 72 - safeRelays * 0.55),
    orbitSpeed: Math.min(3.35, 1.7 + safeRelays * 0.085),
    launchSpeed: Math.min(620, 430 + safeRelays * 8),
    targetRadius: Math.max(21, 38 - safeRelays * 0.85),
    targetMotionAmplitude: Math.min(44, 14 + safeRelays * 1.3),
    targetMotionSpeed: Math.min(2.1, 0.85 + safeRelays * 0.055),
  };
}

export function scoreAfterRelay(previous: OrbitRelayScore): OrbitRelayScore {
  const relays = previous.relays + 1;
  const multiplier = Math.min(4, 1 + Math.floor(relays / 3) * 0.25);
  const score = previous.score + Math.round(100 * multiplier);
  return { relays, score, multiplier };
}

export function orbitPosition(center: Vec2, radius: number, angle: number): Vec2 {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

export function tangentialVelocity(angle: number, speed: number, clockwise = true): Vec2 {
  const tangent = angle + (clockwise ? Math.PI / 2 : -Math.PI / 2);
  return {
    x: Math.cos(tangent) * speed,
    y: Math.sin(tangent) * speed,
  };
}

export function stepPoint(position: Vec2, velocity: Vec2, dtSeconds: number): Vec2 {
  return {
    x: position.x + velocity.x * dtSeconds,
    y: position.y + velocity.y * dtSeconds,
  };
}

export function movingTargetCenter(
  base: Vec2,
  elapsedSeconds: number,
  amplitude: number,
  speed: number,
  phase = 0,
): Vec2 {
  return {
    x: base.x,
    y: base.y + Math.sin(elapsedSeconds * speed + phase) * amplitude,
  };
}

export function intersectsCapture(player: Vec2, playerRadius: number, target: Vec2, targetRadius: number): boolean {
  const dx = player.x - target.x;
  const dy = player.y - target.y;
  const radius = playerRadius + targetRadius;
  return dx * dx + dy * dy <= radius * radius;
}

export function isOutsideBounds(point: Vec2, bounds: Bounds, margin = 36): boolean {
  return point.x < -margin || point.y < -margin || point.x > bounds.width + margin || point.y > bounds.height + margin;
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function nextTargetBase(source: Vec2, bounds: Bounds, relayIndex: number): Vec2 {
  const horizontalPadding = Math.max(92, Math.min(150, bounds.width * 0.16));
  const targetX = source.x < bounds.width / 2 ? bounds.width - horizontalPadding : horizontalPadding;
  const verticalPadding = Math.max(110, Math.min(150, bounds.height * 0.22));
  const usableHeight = Math.max(80, bounds.height - verticalPadding * 2);
  const y = verticalPadding + seededUnit(relayIndex + 1) * usableHeight;
  return { x: targetX, y };
}

export function initialSource(bounds: Bounds): Vec2 {
  return {
    x: Math.max(92, Math.min(150, bounds.width * 0.16)),
    y: bounds.height * 0.5,
  };
}
