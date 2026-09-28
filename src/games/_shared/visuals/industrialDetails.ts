import type Phaser from "phaser";

type Project = (x: number, y: number) => { x: number; y: number };

/** Small canvas details shared by the walkable industrial games. Coordinates remain in world space. */
export function drawIndustrialFloor(g: Phaser.GameObjects.Graphics, project: Project, scale: number, width: number, height: number, tint: number) {
  for (let x = 65; x < width - 40; x += 160) {
    for (let y = 85; y < height - 35; y += 160) {
      const p = project(x, y);
      g.lineStyle(Math.max(0.7, scale), tint, 0.24).strokeRoundedRect(p.x, p.y, 118 * scale, 118 * scale, 5 * scale);
      g.fillStyle(tint, 0.42).fillCircle(p.x + 9 * scale, p.y + 9 * scale, 2.5 * scale);
      g.fillCircle(p.x + 109 * scale, p.y + 109 * scale, 2.5 * scale);
    }
  }
}

export function drawFabToolFace(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, scale: number, color: number, kind: "lithography" | "etch" | "metrology", alarm: boolean, phase: number) {
  const inset = 11 * scale;
  g.fillStyle(0x071217, 0.82).fillRoundedRect(x + inset, y + inset, w - inset * 2, h - inset * 2, 4 * scale);
  g.lineStyle(Math.max(0.7, scale), color, 0.48).strokeRoundedRect(x + inset, y + inset, w - inset * 2, h - inset * 2, 4 * scale);
  const cx = x + w * 0.5, cy = y + h * 0.48;
  if (kind === "lithography") {
    g.lineStyle(Math.max(1, 2 * scale), color, 0.7).strokeCircle(cx, cy, 23 * scale);
    g.fillStyle(color, 0.23).fillCircle(cx, cy, 15 * scale);
    g.lineStyle(Math.max(1, scale), 0xffffff, 0.6).lineBetween(cx - 20 * scale, cy, cx + 20 * scale, cy);
    g.lineBetween(cx, cy - 20 * scale, cx, cy + 20 * scale);
  } else if (kind === "etch") {
    for (let i = 0; i < 5; i += 1) {
      const xx = cx + (i - 2) * 12 * scale;
      g.fillStyle(color, 0.3 + i * 0.1).fillRoundedRect(xx - 4 * scale, cy - (11 + i % 2 * 7) * scale, 8 * scale, (22 + i % 2 * 14) * scale, 2 * scale);
    }
  } else {
    for (let i = 0; i < 4; i += 1) {
      g.lineStyle(Math.max(0.8, scale), color, 0.4 + i * 0.1).strokeCircle(cx, cy, (7 + i * 7) * scale);
    }
    g.fillStyle(color, 0.9).fillCircle(cx, cy, 3 * scale);
  }
  const light = alarm && Math.sin(phase / 180) > 0 ? 0xff6978 : color;
  g.fillStyle(light, 0.95).fillCircle(x + w - 19 * scale, y + 19 * scale, 5 * scale);
  for (let i = 0; i < 4; i += 1) g.fillStyle(color, 0.3 + i * 0.13).fillRect(x + 17 * scale + i * 12 * scale, y + h - 22 * scale, 8 * scale, 3 * scale);
}

export function drawRackFace(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, color: number, kind: "compute" | "network" | "power" | "cooling" | "storage", fault: boolean, phase: number) {
  for (let unit = 0; unit < 6; unit += 1) {
    const yy = y + (-45 + unit * 17) * scale;
    g.fillStyle(0x09121b, 0.9).fillRoundedRect(x - 37 * scale, yy, 74 * scale, 13 * scale, 2 * scale);
    g.lineStyle(Math.max(0.7, scale), color, 0.45).strokeRoundedRect(x - 37 * scale, yy, 74 * scale, 13 * scale, 2 * scale);
    if (kind === "network") {
      for (let port = 0; port < 7; port += 1) g.fillStyle(color, 0.35 + ((port + unit) % 3) * 0.25).fillRect(x - 27 * scale + port * 8 * scale, yy + 5 * scale, 5 * scale, 3 * scale);
    } else if (kind === "cooling") {
      g.lineStyle(Math.max(0.8, scale), color, 0.75).strokeCircle(x - 11 * scale, yy + 6 * scale, 4 * scale).strokeCircle(x + 11 * scale, yy + 6 * scale, 4 * scale);
    } else if (kind === "power") {
      g.fillStyle(color, 0.7).fillRect(x - 25 * scale, yy + 5 * scale, (25 + unit * 5) * scale, 3 * scale);
    } else {
      for (let led = 0; led < (kind === "compute" ? 4 : 3); led += 1) g.fillStyle(color, 0.45 + led * 0.12).fillCircle(x - 24 * scale + led * 14 * scale, yy + 6 * scale, 2 * scale);
    }
  }
  if (fault) {
    g.lineStyle(Math.max(1, 3 * scale), 0xff6574, 0.5 + Math.sin(phase / 150) * 0.35).strokeRoundedRect(x - 44 * scale, y - 62 * scale, 88 * scale, 124 * scale, 5 * scale);
  }
}
