import type Phaser from "phaser";

type Project = (x: number, y: number) => { x: number; y: number };

export function drawOfficeDeskDetails(g: Phaser.GameObjects.Graphics, project: Project, x: number, y: number, width: number, height: number, scale: number, accent: number, phase: number) {
  const screen = project(x + width * 0.55, y + height * 0.35);
  const w = 34 * scale, h = 21 * scale;
  g.fillStyle(0x02080d, 1).fillRoundedRect(screen.x - w / 2, screen.y - h, w, h, 2 * scale);
  g.lineStyle(Math.max(0.7, scale), 0x728d9b, 0.65).strokeRoundedRect(screen.x - w / 2, screen.y - h, w, h, 2 * scale);
  const values = [0.58, 0.48, 0.62, 0.36, 0.42, 0.24, 0.33];
  g.lineStyle(Math.max(0.8, scale), accent, 0.85);
  for (let i = 0; i < values.length - 1; i += 1) {
    g.lineBetween(screen.x + (-12 + i * 4) * scale, screen.y - (3 + values[i] * 15) * scale, screen.x + (-8 + i * 4) * scale, screen.y - (3 + values[i + 1] * 15) * scale);
  }
  g.fillStyle(accent, 0.65 + Math.sin(phase / 550) * 0.2).fillCircle(screen.x + 12 * scale, screen.y - 9 * scale, 1.8 * scale);
  g.fillStyle(0x263c43, 1).fillRect(screen.x - 2 * scale, screen.y, 4 * scale, 5 * scale);
  const paper = project(x + width * 0.27, y + height * 0.55);
  g.fillStyle(0xcbd8d7, 0.7).fillRoundedRect(paper.x - 8 * scale, paper.y - 5 * scale, 15 * scale, 12 * scale, scale);
  for (let i = 0; i < 3; i += 1) g.fillStyle(accent, 0.7).fillRect(paper.x - 5 * scale, paper.y + (-2 + i * 3) * scale, (7 + i * 2) * scale, scale);
  const lamp = project(x + width * 0.82, y + height * 0.57);
  g.fillStyle(0xffd48b, 0.12).fillCircle(lamp.x, lamp.y, 14 * scale);
  g.fillStyle(0xffd48b, 0.8).fillCircle(lamp.x, lamp.y, 2.5 * scale);
}
