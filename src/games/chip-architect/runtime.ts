import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  CHIP_ARCHITECT_WORLD,
  advanceChipArchitect,
  architectPrompt,
  chipArchitectLayout,
  chipArchitectScore,
  chipDesignStats,
  contractMastery,
  createChipArchitectState,
  designComplete,
  designReview,
  getArchitectWorkload,
  getModuleVariant,
  interactChipArchitect,
  moduleVariants,
  tapeoutReady,
  type ArchitectEvent,
  type ChipArchitectState,
  type ModuleType,
} from "./model";

const SAVE_VERSION = 1;
const BG = 0x061016;
const FLOOR = 0x0d1b22;
const GRID = 0x1d3540;
const INK = 0xeaf5f8;
const MUTED = 0x8ca1aa;
const GREEN = 0x5ce1b9;
const YELLOW = 0xffcf66;
const BLUE = 0x68c8ff;
const MODULE_COLORS: Record<ModuleType, number> = {
  compute: 0xffb454,
  memory: 0x67d6ff,
  noc: 0xa58bff,
  io: 0x62e6a9,
};

type Point = { x: number; y: number };
type Label = { text: Phaser.GameObjects.Text; x: number; y: number };

function formatClock(seconds: number) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.07, volume = 0.03) => {
    if (muted || typeof window === "undefined") return;
    try {
      audioContext ??= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Sound is optional.
    }
  };

  class ChipArchitectScene extends Phaser.Scene {
    private state!: ChipArchitectState;
    private graphics?: Phaser.GameObjects.Graphics;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private specText?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private carriedText?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private labels: Label[] = [];
    private visualElapsed = 0;
    private statusElapsed = 0;

    constructor() {
      super("chip-architect");
    }

    create() {
      this.cameras.main.setBackgroundColor(BG);
      this.graphics = this.add.graphics();
      this.hudLeft = this.add.text(14, 12, "", {
        color: "#eaf5f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        backgroundColor: "#061016dd",
        padding: { x: 8, y: 5 },
      }).setDepth(30);
      this.hudRight = this.add.text(this.scale.width - 14, 12, "", {
        color: "#eaf5f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        align: "right",
        backgroundColor: "#061016dd",
        padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30);
      this.specText = this.add.text(this.scale.width / 2, 12, "", {
        color: "#ffcf66",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        align: "center",
        backgroundColor: "#061016ea",
        padding: { x: 9, y: 5 },
      }).setOrigin(0.5, 0).setDepth(31);
      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 11, "", {
        color: "#eaf5f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        backgroundColor: "#061016ef",
        padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 1).setDepth(31);
      this.carriedText = this.add.text(14, this.scale.height - 12, "", {
        color: "#8ca1aa",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineSpacing: 2,
        backgroundColor: "#061016e8",
        padding: { x: 7, y: 5 },
      }).setOrigin(0, 1).setDepth(31);
      this.touchInteract = this.add.text(this.scale.width - 66, this.scale.height - 38, "INTERACT", {
        color: "#5ce1b9",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(33);

      this.buildLabels();
      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 128 && pointer.y >= this.scale.height - 72) this.interact();
      });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (!this.state || this.state.mode !== "playing") return;
      this.visualElapsed += delta;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));
      const pointer = this.input.activePointer;
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 128 && pointer.y >= this.scale.height - 72)) {
        const world = this.pointerToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const d = Math.hypot(dx, dy);
        if (d > 24) {
          x = dx / d;
          y = dy / d;
        }
      }

      const result = advanceChipArchitect(this.state, { x, y }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
      this.statusElapsed += delta;
      if (this.statusElapsed > 700 && this.state.mode === "playing") {
        this.statusElapsed = 0;
        const stats = chipDesignStats(this.state);
        bridge.setStatus(`Chip Architect live · ${getArchitectWorkload(this.state).name} · P${stats.performance} W${stats.power} A${stats.area} T${stats.timing >= 0 ? "+" : ""}${stats.timing}`);
      }
    }

    private projection() {
      const mobile = this.scale.width < 620;
      const scale = mobile ? Math.max(0.58, Math.min(0.76, this.scale.width / 520)) : Math.min((this.scale.width - 44) / CHIP_ARCHITECT_WORLD.width, (this.scale.height - 86) / CHIP_ARCHITECT_WORLD.height);
      return {
        mobile,
        scale,
        cameraX: mobile ? this.state.playerX : CHIP_ARCHITECT_WORLD.width / 2,
        cameraY: mobile ? this.state.playerY : CHIP_ARCHITECT_WORLD.height / 2,
        anchorX: this.scale.width / 2,
        anchorY: mobile ? this.scale.height * 0.54 : this.scale.height / 2 + 14,
      };
    }

    private project(x: number, y: number): Point {
      const p = this.projection();
      return { x: p.anchorX + (x - p.cameraX) * p.scale, y: p.anchorY + (y - p.cameraY) * p.scale };
    }

    private pointerToWorld(screenX: number, screenY: number) {
      const p = this.projection();
      return { x: p.cameraX + (screenX - p.anchorX) / p.scale, y: p.cameraY + (screenY - p.anchorY) / p.scale };
    }

    private buildLabels() {
      const specs = [
        ["COMPUTE IP", 105, 92, "#ffb454"],
        ["MEMORY IP", 245, 92, "#67d6ff"],
        ["NoC IP", 105, 455, "#a58bff"],
        ["I/O IP", 245, 455, "#62e6a9"],
        ["FLOORPLAN", 630, 205, "#eaf5f8"],
        ["VERIFY", chipArchitectLayout.verify.x, chipArchitectLayout.verify.y - 58, "#5ce1b9"],
        ["CLOCK / PVT", chipArchitectLayout.tune.x, chipArchitectLayout.tune.y - 58, "#67d6ff"],
        ["TAPEOUT", chipArchitectLayout.tapeout.x, chipArchitectLayout.tapeout.y - 62, "#ffcf66"],
      ] as const;
      this.labels = specs.map(([label, x, y, color]) => ({
        text: this.add.text(0, 0, label, {
          color,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          backgroundColor: "#061016dc",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1).setDepth(18),
        x,
        y,
      }));
    }

    private draw() {
      const g = this.graphics;
      if (!g) return;
      g.clear();
      g.fillStyle(BG, 1).fillRect(0, 0, this.scale.width, this.scale.height);
      const p = this.projection();
      const a = this.project(0, 0);
      const b = this.project(CHIP_ARCHITECT_WORLD.width, CHIP_ARCHITECT_WORLD.height);
      g.fillStyle(FLOOR, 1).fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      g.lineStyle(Math.max(0.6, p.scale), GRID, 0.5);
      for (let x = 0; x <= CHIP_ARCHITECT_WORLD.width; x += 80) {
        const top = this.project(x, 0); const bottom = this.project(x, CHIP_ARCHITECT_WORLD.height);
        g.lineBetween(top.x, top.y, bottom.x, bottom.y);
      }
      for (let y = 0; y <= CHIP_ARCHITECT_WORLD.height; y += 80) {
        const left = this.project(0, y); const right = this.project(CHIP_ARCHITECT_WORLD.width, y);
        g.lineBetween(left.x, left.y, right.x, right.y);
      }

      this.drawLabDetails();

      this.drawBench(350, 105, 190, 92);
      this.drawBench(350, 545, 190, 92);
      this.drawBench(855, 535, 180, 92);
      this.drawFloorplan();
      this.drawStations();
      this.drawLibrary();
      this.drawPlayer();

      for (const label of this.labels) {
        const point = this.project(label.x, label.y);
        label.text.setPosition(point.x, point.y);
        label.text.setVisible(point.x > -90 && point.x < this.scale.width + 90 && point.y > -40 && point.y < this.scale.height + 60);
      }

      const stats = chipDesignStats(this.state);
      const spec = getArchitectWorkload(this.state);
      this.hudLeft?.setText(`P ${stats.performance}/${spec.minPerformance}   W ${stats.power}/${spec.maxPower}\nA ${stats.area}/${spec.maxArea}   T ${stats.timing >= 0 ? "+" : ""}${stats.timing}/${spec.minTiming >= 0 ? "+" : ""}${spec.minTiming}`);
      this.hudRight?.setText(`${formatClock(this.state.jobTimeLeft)} SPEC · ${formatClock(this.state.timeLeft)} RUN\nContract ${this.state.jobIndex + 1}/4 · Mastery ${this.state.mastery}/12 · Rep ${this.state.reputation}`);
      this.specText?.setText(`${spec.customer.toUpperCase()} · ${spec.name.toUpperCase()} · ${this.state.frequency.toUpperCase()} · YIELD ${(stats.reliability * 100).toFixed(1)}/${(spec.minReliability * 100).toFixed(0)}%`);
      this.prompt?.setText(`${architectPrompt(this.state)} · WASD/ARROWS + E`);
      const carried = getModuleVariant(this.state.carriedVariantId);
      this.carriedText?.setText(carried ? `CARRYING ${carried.name}\nP${carried.performance} W${carried.power} A${carried.area} T${carried.timing >= 0 ? "+" : ""}${carried.timing}` : `BUILD → VERIFY → TAPEOUT · ${tapeoutReady(this.state) ? `${contractMastery(this.state)}/3 MASTERY` : designComplete(this.state) ? "RUN DESIGN REVIEW" : "COLLECT IP"}\n${this.state.verified ? this.state.review : designReview(this.state)}`);
      this.carriedText?.setWordWrapWidth(Math.max(130, Math.min(520, this.scale.width - 155)));

      const buttonX = this.scale.width - 119;
      const buttonY = this.scale.height - 61;
      g.fillStyle(0x09161b, 0.96).fillRoundedRect(buttonX, buttonY, 104, 44, 9);
      g.lineStyle(1.5, GREEN, 0.8).strokeRoundedRect(buttonX, buttonY, 104, 44, 9);

      mount.dataset.archX = this.state.playerX.toFixed(1);
      mount.dataset.archY = this.state.playerY.toFixed(1);
      mount.dataset.archCarried = this.state.carriedVariantId ?? "";
      mount.dataset.archSlots = String(Object.values(this.state.slots).filter(Boolean).length);
      mount.dataset.archVerified = this.state.verified ? "true" : "false";
      mount.dataset.archTapeouts = String(this.state.tapeouts);
      mount.dataset.archFrequency = this.state.frequency;
      mount.dataset.archReady = tapeoutReady(this.state) ? "true" : "false";
      mount.dataset.archMode = this.state.mode;
    }

    private drawBench(x: number, y: number, width: number, height: number) {
      const p = this.project(x, y); const q = this.project(x + width, y + height);
      const s = this.projection().scale;
      this.graphics?.fillStyle(0x02090d, 0.8).fillRoundedRect(p.x + 5 * s, p.y + 9 * s, q.x - p.x, q.y - p.y, 5);
      this.graphics?.fillStyle(0x172b34, 1).fillRoundedRect(p.x, p.y, q.x - p.x, q.y - p.y, 5);
      this.graphics?.lineStyle(1, GRID, 0.9).strokeRoundedRect(p.x, p.y, q.x - p.x, q.y - p.y, 5);
      const screen = this.project(x + width * 0.62, y + height * 0.42);
      this.graphics?.fillStyle(0x020607, 1).fillRoundedRect(screen.x - 27 * s, screen.y - 20 * s, 54 * s, 34 * s, 2);
      this.graphics?.lineStyle(Math.max(1, s), 0x5da7b7, 0.8).strokeRoundedRect(screen.x - 27 * s, screen.y - 20 * s, 54 * s, 34 * s, 2);
      for (let i = 0; i < 4; i += 1) {
        this.graphics?.fillStyle(i === 3 ? GREEN : 0x4f8797, 0.8).fillRect(screen.x - 19 * s, screen.y - 12 * s + i * 6 * s, (14 + i * 7) * s, 2 * s);
      }
      this.graphics?.fillStyle(0x536b74, 1).fillRect(screen.x - 4 * s, screen.y + 14 * s, 8 * s, 8 * s);
      this.graphics?.fillStyle(0x354d56, 1).fillRoundedRect(screen.x - 20 * s, screen.y + 22 * s, 40 * s, 5 * s, 2);
      for (let i = 0; i < 7; i += 1) this.graphics?.fillStyle(0x5a7a83, 0.75).fillRect(p.x + (12 + i * 12) * s, q.y - 17 * s, 7 * s, 2 * s);
    }

    private drawLabDetails() {
      const g = this.graphics; if (!g) return;
      const s = this.projection().scale;
      for (const [x, y, color] of [[42, 45, BLUE], [1150, 50, GREEN], [42, 710, GREEN], [1145, 700, BLUE]] as const) {
        const p = this.project(x, y);
        g.fillStyle(color, 0.12).fillCircle(p.x, p.y, 32 * s);
        g.fillStyle(color, 0.8).fillRoundedRect(p.x - 14 * s, p.y - 3 * s, 28 * s, 6 * s, 2);
      }
      // Dedicated walkways make the four library aisles and central design bay legible.
      for (const [x, y, w, h] of [[32, 48, 280, 362], [32, 430, 280, 315], [420, 195, 420, 355], [885, 165, 255, 355]] as const) {
        const a = this.project(x, y); const b = this.project(x + w, y + h);
        g.fillStyle(0x142a33, 0.23).fillRoundedRect(a.x, a.y, b.x - a.x, b.y - a.y, 12 * s);
        g.lineStyle(Math.max(0.5, s), 0x4b7783, 0.27).strokeRoundedRect(a.x, a.y, b.x - a.x, b.y - a.y, 12 * s);
      }
      for (let i = 0; i < 12; i += 1) {
        const p = this.project(335 + i * 70, 365);
        g.fillStyle(YELLOW, 0.25).fillRoundedRect(p.x, p.y, 18 * s, 2 * s, s);
      }
    }

    private drawLibrary() {
      const g = this.graphics; const s = this.projection().scale;
      for (const [x, y, color] of [[105, 150, MODULE_COLORS.compute], [245, 150, MODULE_COLORS.memory], [105, 520, MODULE_COLORS.noc], [245, 520, MODULE_COLORS.io]] as const) {
        const a = this.project(x - 48, y - 37); const b = this.project(x + 48, y + 224);
        g?.fillStyle(0x07141b, 0.8).fillRoundedRect(a.x, a.y, b.x - a.x, b.y - a.y, 6 * s);
        g?.lineStyle(Math.max(0.8, s), color, 0.5).strokeRoundedRect(a.x, a.y, b.x - a.x, b.y - a.y, 6 * s);
        for (let shelf = 0; shelf < 3; shelf += 1) {
          const p = this.project(x - 39, y + 34 + shelf * 95);
          g?.fillStyle(color, 0.3).fillRect(p.x, p.y, 78 * s, 3 * s);
        }
      }
      for (const variant of moduleVariants) {
        const point = this.project(variant.x, variant.y);
        const s = this.projection().scale;
        const carried = this.state.carriedVariantId === variant.id;
        gBlock(this.graphics, point.x, point.y, MODULE_COLORS[variant.type], variant.shortName, s, carried ? 0.35 : 1);
      }
    }

    private drawFloorplan() {
      const topLeft = this.project(455, 215); const bottomRight = this.project(805, 515);
      const g = this.graphics; if (!g) return;
      const s = this.projection().scale;
      g.fillStyle(0x020607, 0.8).fillRoundedRect(topLeft.x + 10 * s, topLeft.y + 13 * s, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y, 10);
      g.fillStyle(0x0b2029, 1).fillRoundedRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y, 10);
      g.lineStyle(2, 0x90acb4, 0.9).strokeRoundedRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y, 10);
      // Package pads, die outline, and routed buses change as blocks are installed.
      for (let i = 0; i < 18; i += 1) {
        for (const [x, y] of [[468 + i * 18, 220], [468 + i * 18, 502], [460, 228 + i * 16], [795, 228 + i * 16]] as const) {
          const pad = this.project(x, y);
          g.fillStyle(0x89b2bd, 0.58).fillRoundedRect(pad.x, pad.y, 5 * s, 7 * s, s);
        }
      }
      const routes: [ModuleType, ModuleType][] = [["compute", "memory"], ["compute", "noc"], ["memory", "io"], ["noc", "io"]];
      for (const [from, to] of routes) {
        const a = chipArchitectLayout.slots[from]; const b = chipArchitectLayout.slots[to];
        const live = Boolean(this.state.slots[from] && this.state.slots[to]);
        for (let lane = -1; lane <= 1; lane += 1) {
          const p = this.project(a.x + (a.x === b.x ? lane * 9 : 0), a.y + (a.y === b.y ? lane * 9 : 0));
          const q = this.project(b.x + (a.x === b.x ? lane * 9 : 0), b.y + (a.y === b.y ? lane * 9 : 0));
          g.lineStyle(Math.max(1, 2.2 * s), live ? GREEN : 0x496773, live ? 0.8 : 0.4).lineBetween(p.x, p.y, q.x, q.y);
          if (live) {
            const phase = (this.visualElapsed / 1050 + (lane + 1) / 3) % 1;
            g.fillStyle(0xc8fff0, 0.9).fillCircle(p.x + (q.x - p.x) * phase, p.y + (q.y - p.y) * phase, Math.max(1.3, 2.7 * s));
          }
        }
      }
      for (const type of Object.keys(chipArchitectLayout.slots) as ModuleType[]) {
        const slot = chipArchitectLayout.slots[type];
        const point = this.project(slot.x, slot.y);
        const variant = getModuleVariant(this.state.slots[type]);
        g.fillStyle(MODULE_COLORS[type], variant ? 0.18 : 0.05).fillRoundedRect(point.x - 52 * s, point.y - 43 * s, 104 * s, 86 * s, 8);
        g.lineStyle(Math.max(1.2, 2 * s), MODULE_COLORS[type], variant ? 0.9 : 0.45).strokeRoundedRect(point.x - 52 * s, point.y - 43 * s, 104 * s, 86 * s, 8);
        if (variant) this.drawInstalledBlock(point.x, point.y, s, type, variant.id);
      }
    }

    private drawInstalledBlock(x: number, y: number, s: number, type: ModuleType, id: string) {
      const g = this.graphics; if (!g) return;
      const color = MODULE_COLORS[type];
      g.fillStyle(0x02090d, 0.85).fillRoundedRect(x - 39 * s, y - 31 * s, 78 * s, 62 * s, 5 * s);
      g.lineStyle(Math.max(1, 2 * s), color, 0.9).strokeRoundedRect(x - 39 * s, y - 31 * s, 78 * s, 62 * s, 5 * s);
      if (type === "compute") {
        const count = id === "vector-array" ? 5 : id === "wide-core" ? 4 : 2;
        for (let i = 0; i < count; i += 1) for (let j = 0; j < 3; j += 1) {
          g.fillStyle(color, 0.7).fillRoundedRect(x + (i - (count - 1) / 2) * 12 * s - 4 * s, y + (j - 1) * 13 * s - 4 * s, 8 * s, 8 * s, s);
        }
      } else if (type === "memory") {
        for (let i = 0; i < (id === "deep-sram" ? 5 : id === "banked-sram" ? 4 : 3); i += 1) {
          g.fillStyle(color, 0.15 + i * 0.08).fillRoundedRect(x - 28 * s + i * 11 * s, y - 18 * s, 8 * s, 37 * s, s);
          g.lineStyle(Math.max(0.7, s), color, 0.7).strokeRoundedRect(x - 28 * s + i * 11 * s, y - 18 * s, 8 * s, 37 * s, s);
        }
      } else if (type === "noc") {
        const nodes = id === "ring-noc" ? 4 : 9;
        for (let i = 0; i < nodes; i += 1) {
          const px = x + (nodes === 4 ? [-19, 19, 19, -19][i] : (i % 3 - 1) * 18) * s;
          const py = y + (nodes === 4 ? [-16, -16, 16, 16][i] : (Math.floor(i / 3) - 1) * 15) * s;
          g.fillStyle(color, 0.9).fillCircle(px, py, 3.5 * s);
        }
        g.lineStyle(Math.max(0.8, s), color, 0.45).strokeRect(x - 21 * s, y - 18 * s, 42 * s, 36 * s);
      } else {
        const lanes = id === "serdes-224" ? 6 : id === "serdes-112" ? 4 : 2;
        for (let i = 0; i < lanes; i += 1) {
          const py = y + (i - (lanes - 1) / 2) * 8 * s;
          g.lineStyle(Math.max(1, 2 * s), color, 0.8).lineBetween(x - 25 * s, py, x + 24 * s, py);
          g.fillStyle(color, 0.95).fillCircle(x + 25 * s, py, 2 * s);
        }
      }
      for (let i = 0; i < 7; i += 1) {
        g.fillStyle(0xa1c5ca, 0.65).fillRect(x - 27 * s + i * 9 * s, y - 34 * s, 3 * s, 3 * s);
        g.fillRect(x - 27 * s + i * 9 * s, y + 31 * s, 3 * s, 3 * s);
      }
    }

    private drawStations() {
      this.drawStation(chipArchitectLayout.verify.x, chipArchitectLayout.verify.y, this.state.verified ? (this.state.verificationPass ? GREEN : 0xff6b74) : GREEN);
      this.drawStation(chipArchitectLayout.tune.x, chipArchitectLayout.tune.y, BLUE);
      this.drawStation(chipArchitectLayout.tapeout.x, chipArchitectLayout.tapeout.y, tapeoutReady(this.state) ? YELLOW : MUTED);
    }

    private drawStation(x: number, y: number, color: number) {
      const point = this.project(x, y); const s = this.projection().scale;
      const pulse = 1 + Math.sin((this.visualElapsed + x) / 240) * 0.04;
      const g = this.graphics;
      g?.fillStyle(color, 0.06).fillCircle(point.x, point.y, 47 * s * pulse);
      g?.lineStyle(Math.max(1, 1.6 * s), color, 0.65).strokeCircle(point.x, point.y, 40 * s * pulse);
      g?.fillStyle(0x02090d, 0.7).fillRoundedRect(point.x - 28 * s + 4 * s, point.y - 21 * s + 6 * s, 56 * s, 43 * s, 5 * s);
      g?.fillStyle(0x102b33, 1).fillRoundedRect(point.x - 28 * s, point.y - 21 * s, 56 * s, 43 * s, 5 * s);
      g?.lineStyle(Math.max(1, 1.6 * s), color, 0.9).strokeRoundedRect(point.x - 28 * s, point.y - 21 * s, 56 * s, 43 * s, 5 * s);
      g?.fillStyle(0x02080d, 1).fillRoundedRect(point.x - 20 * s, point.y - 14 * s, 40 * s, 18 * s, 2 * s);
      for (let i = 0; i < 4; i += 1) {
        g?.fillStyle(color, i === 3 ? 0.95 : 0.25 + i * 0.15).fillRect(point.x - 15 * s + i * 9 * s, point.y - 4 * s - i * 2 * s, 5 * s, (5 + i * 2) * s);
      }
      g?.fillStyle(color, 0.85).fillCircle(point.x - 16 * s, point.y + 13 * s, 2.5 * s);
      g?.fillStyle(0x42616b, 1).fillRoundedRect(point.x - 8 * s, point.y + 11 * s, 28 * s, 4 * s, s);
    }

    private drawPlayer() {
      const point = this.project(this.state.playerX, this.state.playerY); const s = this.projection().scale;
      const bob = Math.sin(this.visualElapsed / 150) * 1.1 * s;
      this.graphics?.fillStyle(0x000000, 0.42).fillEllipse(point.x + 2 * s, point.y + 11 * s, 22 * s, 8 * s);
      this.graphics?.lineStyle(Math.max(1, 3 * s), INK, 1).lineBetween(point.x - 4 * s, point.y + 2 * s + bob, point.x - 6 * s, point.y + 14 * s);
      this.graphics?.lineStyle(Math.max(1, 3 * s), INK, 1).lineBetween(point.x + 4 * s, point.y + 2 * s + bob, point.x + 6 * s, point.y + 14 * s);
      this.graphics?.fillStyle(INK, 1).fillRoundedRect(point.x - 8 * s, point.y - 12 * s + bob, 16 * s, 18 * s, 5 * s);
      this.graphics?.fillStyle(0xf0c6a0, 1).fillCircle(point.x, point.y - 18 * s + bob, 6.5 * s);
      const carried = getModuleVariant(this.state.carriedVariantId);
      if (carried) gBlock(this.graphics, point.x, point.y - 38 * s, MODULE_COLORS[carried.type], carried.shortName, s * 0.7, 1);
    }

    private interact() {
      if (!this.state || this.state.mode !== "playing") return;
      const result = interactChipArchitect(this.state);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
    }

    private handleEvent(event: ArchitectEvent) {
      if (event === "none" || event === "collision") return;
      if (event === "block_picked") {
        tone(470);
        bridge.emit("game_action", { action: "pick_ip", variant: this.state.carriedVariantId });
      } else if (event === "block_placed") {
        tone(590);
        bridge.emit("game_action", { action: "place_ip", slots_filled: Object.values(this.state.slots).filter(Boolean).length });
      } else if (event === "block_removed") {
        tone(330);
      } else if (event === "frequency_changed") {
        tone(this.state.frequency === "turbo" ? 760 : this.state.frequency === "eco" ? 420 : 560);
        bridge.emit("game_action", { action: "clock_mode", frequency: this.state.frequency });
      } else if (event === "verification_passed") {
        tone(820, 0.11, 0.045);
        bridge.emit("level_completed", { action: "verification_pass", workload: getArchitectWorkload(this.state).id });
        bridge.setStatus(`Verification clean — ${this.state.review}`);
      } else if (event === "verification_failed") {
        tone(170, 0.14, 0.045);
        bridge.emit("game_action", { action: "verification_fail", timing: chipDesignStats(this.state).timing });
        bridge.setStatus(`Verification failed — ${this.state.review}`);
      } else if (event === "tapeout_blocked") {
        tone(210);
        bridge.setStatus(`Tapeout blocked — ${designReview(this.state)}`);
      } else if (event === "tapeout") {
        tone(920, 0.14, 0.05);
        bridge.emit("level_completed", { action: "tapeout", tapeouts: this.state.tapeouts, score: chipArchitectScore(this.state) });
        bridge.setStatus(`Tapeout shipped — next customer spec loaded · ${getArchitectWorkload(this.state).name}`);
      } else if (event === "job_missed") {
        tone(130, 0.16, 0.045);
        bridge.emit("game_action", { action: "missed_spec", missed: this.state.missedJobs, reputation: this.state.reputation });
        bridge.setStatus(`Customer window missed — next specification loaded · reputation ${this.state.reputation}`);
      } else if (event === "complete" || event === "failed") {
        this.endRun(event === "failed");
      }
    }

    private endRun(failed: boolean) {
      const score = chipArchitectScore(this.state);
      bestScore = Math.max(bestScore, score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      bridge.emit("game_over", { score, tapeouts: this.state.tapeouts, mastery: this.state.mastery, missed_specs: this.state.missedJobs, reputation: this.state.reputation, failed });
      bridge.setStatus(`${failed ? "Architecture program cancelled" : "Architecture sprint complete"} — ${this.state.tapeouts} tapeouts · score ${score}`);
      this.endTitle?.destroy(); this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 32, failed ? "PROGRAM CANCELLED" : "DESIGN REVIEW", {
        color: "#eaf5f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "28px", fontStyle: "bold", backgroundColor: "#061016f2", padding: { x: 18, y: 11 },
      }).setOrigin(0.5).setDepth(40);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 32, `${this.state.tapeouts} tapeouts · ${this.state.mastery}/12 mastery · ${this.state.missedJobs} misses\n${this.state.review}\nScore ${score} · Best ${bestScore}\nPress R or Restart for a new architecture sprint`, {
        color: "#9fb2ba", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", lineSpacing: 6, backgroundColor: "#061016f2", padding: { x: 18, y: 11 },
      }).setOrigin(0.5).setDepth(40);
    }

    private resetRun() {
      this.endTitle?.destroy(); this.endDetail?.destroy(); this.endTitle = undefined; this.endDetail = undefined;
      this.state = createChipArchitectState();
      this.visualElapsed = 0; this.statusElapsed = 0;
      this.draw();
      bridge.setStatus("Chip Architect live — build the customer die by moving IP blocks into the floorplan");
      bridge.emit("game_started", { mode: "walkable-chip-design-lab", session_seconds: 300 });
    }

    private handleResize() {
      this.hudRight?.setPosition(this.scale.width - 14, 12);
      this.specText?.setPosition(this.scale.width / 2, 12);
      this.prompt?.setPosition(this.scale.width / 2, this.scale.height - 11);
      this.carriedText?.setPosition(14, this.scale.height - 12);
      this.touchInteract?.setPosition(this.scale.width - 66, this.scale.height - 38);
      this.endTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 32);
      this.endDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 32);
      this.draw();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BG,
    scene: [ChipArchitectScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("chip-architect"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("chip-architect"); bridge.setStatus("Chip Architect resumed"); },
    restart() { game.scene.stop("chip-architect"); game.scene.start("chip-architect"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() {
      for (const key of ["archX", "archY", "archCarried", "archSlots", "archVerified", "archTapeouts", "archFrequency", "archReady", "archMode"]) delete mount.dataset[key];
      game.destroy(true); void audioContext?.close(); audioContext = null;
    },
  } satisfies GameRuntimeController;
}

function gBlock(graphics: Phaser.GameObjects.Graphics | undefined, x: number, y: number, color: number, label: string, scale: number, alpha: number) {
  if (!graphics) return;
  const width = Math.max(32, 45 * scale);
  const height = Math.max(22, 30 * scale);
  graphics.fillStyle(0x020607, 0.48 * alpha).fillRoundedRect(x - width / 2 + 3, y - height / 2 + 4, width, height, 4);
  graphics.fillStyle(color, 0.9 * alpha).fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
  graphics.fillStyle(0x061016, 0.72 * alpha).fillRoundedRect(x - width * 0.34, y - height * 0.24, width * 0.68, height * 0.48, 2);
  const bars = Math.min(5, Math.max(2, Math.ceil(label.length / 2)));
  graphics.fillStyle(INK, 0.85 * alpha);
  for (let i = 0; i < bars; i += 1) graphics.fillRect(x - width * 0.25 + i * width * 0.11, y - 1, width * 0.07, 2);
}
