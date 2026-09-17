export type WorldCamera = {
  cameraX: number;
  cameraY: number;
  anchorX: number;
  anchorY: number;
  scale: number;
};

function clamp(value: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

export function boundedWorldCamera(input: {
  playerX: number;
  playerY: number;
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  scale: number;
  anchorX?: number;
  anchorY?: number;
}): WorldCamera {
  const anchorX = input.anchorX ?? input.viewportWidth / 2;
  const anchorY = input.anchorY ?? input.viewportHeight / 2;
  const leftSpan = anchorX / input.scale;
  const rightSpan = (input.viewportWidth - anchorX) / input.scale;
  const topSpan = anchorY / input.scale;
  const bottomSpan = (input.viewportHeight - anchorY) / input.scale;

  return {
    cameraX: clamp(input.playerX, leftSpan, input.worldWidth - rightSpan),
    cameraY: clamp(input.playerY, topSpan, input.worldHeight - bottomSpan),
    anchorX,
    anchorY,
    scale: input.scale,
  };
}
