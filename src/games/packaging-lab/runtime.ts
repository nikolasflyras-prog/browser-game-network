import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  PACKAGING_WORLD,
  advancePackagingLab,
  createPackagingState,
  getPackageComponent,
  getPackageSpec,
  interactPackagingLab,
  packageComponents,
  packageMeetsSpec,
  packageSlotPositions,
  packageStats,
  packagingCounts,
  packagingLayout,
  packagingPrompt,
  packagingScore,
  type ComponentType,
  type PackagingEvent,
  type PackagingState,
} from "./model";

const SAVE_VERSION = 1;
const BG = 0x071012;
const FLOOR = 0x0e1d20;
const GRID = 0x1e383d;
const INK = 0xe9f6f4;
const MUTED = 0x91a4a2;
const GREEN = 0x68e0b5;
const YELLOW = 0xffce68;
const RED = 0xff6e80;
const CYAN = 0x66d9f3;
const PURPLE = 0xc09cff;
const TYPE_COLORS: Record<ComponentType, number> = {
  compute: 0xffaa55,
  hbm: 0x7bb8ff,
  io: 0x61e0b4,
  bridge: 0xc6a0ff,
  optics: 0xff78c6,
  spreader: 0x73e3ee,
};

type Point = { x: number; y: number };
type WorldLabel = { text: Phaser.GameObjects.Text; x: number; y: number };

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

  class PackagingLabScene extends Phaser.Scene {
    private state!: PackagingState;
    private graphics?: Phaser.GameObjects.Graphics;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private specText?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private detail?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private labels: WorldLabel[] = [];
    private visualElapsed = 0;
    private statusElapsed = 0;

    constructor() { super("packaging-lab"); }

    create() {
      this.cameras.main.setBackgroundColor(BG);
      this.graphics = this.add.graphics();
      this.hudLeft = this.add.text(14, 12, "", { color: "#e9f6f4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold", backgroundColor: "#071012df", padding: { x: 8, y: 5 } }).setDepth(30);
      this.hudRight = this.add.text(this.scale.width - 14, 12, "", { color: "#e9f6f4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold", align: "right", backgroundColor: "#071012df", padding: { x: 8, y: 5 } }).setOrigin(1, 0).setDepth(30);
      this.specText = this.add.text(this.scale.width / 2, 12, "", { color: "#ffce68", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold", align: "center", backgroundColor: "#071012eb", padding: { x: 9, y: 5 } }).setOrigin(0.5, 0).setDepth(31);
      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 11, "", { color: "#e9f6f4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold", backgroundColor: "#071012ef", padding: { x: 8, y: 5 } }).setOrigin(0.5, 1).setDepth(31);
      this.detail = this.add.text(14, this.scale.height - 12, "", { color: "#91a4a2", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", lineSpacing: 2, backgroundColor: "#071012e8", padding: { x: 7, y: 5 } }).setOrigin(0, 1).setDepth(31);
      this.touchInteract = this.add.text(this.scale.width - 66, this.scale.height - 38, "INTERACT", { color: "#68e0b5", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", fontStyle: "bold" }).setOrigin(0.5).setDepth(33);
      this.buildLabels();

      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => { if (pointer.x >= this.scale.width - 128 && pointer.y >= this.scale.height - 72) this.interact(); });
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
        const dx = world.x - this.state.playerX; const dy = world.y - this.state.playerY; const d = Math.hypot(dx, dy);
        if (d > 24) { x = dx / d; y = dy / d; }
      }

      const result = advancePackagingLab(this.state, { x, y }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
      this.statusElapsed += delta;
      if (this.statusElapsed > 700 && this.state.mode === "playing") {
        this.statusElapsed = 0;
        const stats = packageStats(this.state);
        bridge.setStatus(`Packaging Lab live · ${getPackageSpec(this.state).name} · BW ${stats.bandwidth} · Hotspot ${stats.thermalPeak} · Yield ${(stats.yield * 100).toFixed(1)}%`);
      }
    }

    private projection() {
      const mobile = this.scale.width < 620;
      const scale = mobile ? Math.max(0.58, Math.min(0.76, this.scale.width / 520)) : Math.min((this.scale.width - 44) / PACKAGING_WORLD.width, (this.scale.height - 86) / PACKAGING_WORLD.height);
      return { mobile, scale, cameraX: mobile ? this.state.playerX : PACKAGING_WORLD.width / 2, cameraY: mobile ? this.state.playerY : PACKAGING_WORLD.height / 2, anchorX: this.scale.width / 2, anchorY: mobile ? this.scale.height * 0.54 : this.scale.height / 2 + 14 };
    }

    private project(x: number, y: number): Point {
      const p = this.projection(); return { x: p.anchorX + (x - p.cameraX) * p.scale, y: p.anchorY + (y - p.cameraY) * p.scale };
    }

    private pointerToWorld(screenX: number, screenY: number) {
      const p = this.projection(); return { x: p.cameraX + (screenX - p.anchorX) / p.scale, y: p.cameraY + (screenY - p.anchorY) / p.scale };
    }

    private buildLabels() {
      const specs = [
        ["COMPUTE", 105, 95, "#ffaa55"], ["MEMORY", 105, 400, "#7bb8ff"], ["I/O + BRIDGE", 255, 95, "#61e0b4"], ["OPTICS + THERMAL", 255, 400, "#ff78c6"],
        ["PACKAGE SUBSTRATE", 650, 205, "#e9f6f4"], ["X-RAY / REFLOW", packagingLayout.inspect.x, packagingLayout.inspect.y - 58, "#68e0b5"],
        ["BOND PROFILE", packagingLayout.profile.x, packagingLayout.profile.y - 58, "#66d9f3"], ["SHIP", packagingLayout.ship.x, packagingLayout.ship.y - 58, "#ffce68"],
      ] as const;
      this.labels = specs.map(([label, x, y, color]) => ({ text: this.add.text(0, 0, label, { color, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", fontStyle: "bold", backgroundColor: "#071012dc", padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(18), x, y }));
    }

    private draw() {
      const g = this.graphics; if (!g) return;
      g.clear(); g.fillStyle(BG, 1).fillRect(0, 0, this.scale.width, this.scale.height);
      const p = this.projection(); const a = this.project(0, 0); const b = this.project(PACKAGING_WORLD.width, PACKAGING_WORLD.height);
      g.fillStyle(FLOOR, 1).fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      g.lineStyle(Math.max(0.6, p.scale), GRID, 0.5);
      for (let x = 0; x <= PACKAGING_WORLD.width; x += 80) { const top = this.project(x, 0); const bottom = this.project(x, PACKAGING_WORLD.height); g.lineBetween(top.x, top.y, bottom.x, bottom.y); }
      for (let y = 0; y <= PACKAGING_WORLD.height; y += 80) { const left = this.project(0, y); const right = this.project(PACKAGING_WORLD.width, y); g.lineBetween(left.x, left.y, right.x, right.y); }

      this.drawBench(345, 105, 185, 95); this.drawBench(345, 545, 185, 95); this.drawBench(850, 545, 185, 95);
      this.drawSubstrate(); this.drawBins(); this.drawStations(); this.drawPlayer();
      for (const label of this.labels) { const point = this.project(label.x, label.y); label.text.setPosition(point.x, point.y); label.text.setVisible(point.x > -90 && point.x < this.scale.width + 90 && point.y > -40 && point.y < this.scale.height + 60); }

      const stats = packageStats(this.state); const spec = getPackageSpec(this.state); const counts = packagingCounts(this.state);
      this.hudLeft?.setText(`C ${stats.compute}/${spec.minCompute}   BW ${stats.bandwidth}/${spec.minBandwidth}\nHOT ${stats.thermalPeak}/${spec.maxThermal}   WARP ${stats.warpage}/${spec.maxWarpage}   Y ${(stats.yield * 100).toFixed(1)}%`);
      this.hudRight?.setText(`${formatClock(this.state.jobTimeLeft)} SPEC · ${formatClock(this.state.timeLeft)} RUN\nShipped ${this.state.packagesShipped} · Rep ${this.state.reputation} · Best ${bestScore}`);
      this.specText?.setText(`${spec.customer.toUpperCase()} · ${spec.name.toUpperCase()} · ${this.state.bondProfile.toUpperCase()} BOND`);
      this.prompt?.setText(`${packagingPrompt(this.state)} · WASD/ARROWS + E`);
      const carried = getPackageComponent(this.state.carriedComponentId);
      const inspection = this.state.inspectionPending ? `X-RAY/REFLOW ${this.state.inspectionCooldown.toFixed(1)}s` : this.state.inspected ? (this.state.inspectionPass ? "INSPECTION PASS" : "INSPECTION FAIL") : "NOT INSPECTED";
      this.detail?.setText(carried ? `CARRYING ${carried.name}\nHeat ${carried.thermal} · BW ${carried.bandwidth} · KGD ${(carried.yield * 100).toFixed(1)}%` : `DIES ${stats.occupied}/6 · C${counts.compute} H${counts.hbm} I${counts.io} B${counts.bridge} O${counts.optics} S${counts.spreader}\n${inspection}`);

      const buttonX = this.scale.width - 119; const buttonY = this.scale.height - 61;
      g.fillStyle(0x091618, 0.96).fillRoundedRect(buttonX, buttonY, 104, 44, 9); g.lineStyle(1.5, GREEN, 0.8).strokeRoundedRect(buttonX, buttonY, 104, 44, 9);

      mount.dataset.pkgX = this.state.playerX.toFixed(1); mount.dataset.pkgY = this.state.playerY.toFixed(1); mount.dataset.pkgCarried = this.state.carriedComponentId ?? "";
      mount.dataset.pkgSlots = String(stats.occupied); mount.dataset.pkgPending = this.state.inspectionPending ? "true" : "false"; mount.dataset.pkgInspected = this.state.inspected ? "true" : "false";
      mount.dataset.pkgPass = this.state.inspectionPass ? "true" : "false"; mount.dataset.pkgShipped = String(this.state.packagesShipped); mount.dataset.pkgProfile = this.state.bondProfile;
      mount.dataset.pkgMeetsSpec = packageMeetsSpec(this.state) ? "true" : "false"; mount.dataset.pkgMode = this.state.mode;
    }

    private drawBench(x: number, y: number, width: number, height: number) {
      const p = this.project(x, y); const q = this.project(x + width, y + height);
      this.graphics?.fillStyle(0x183034, 1).fillRoundedRect(p.x, p.y, q.x - p.x, q.y - p.y, 5); this.graphics?.lineStyle(1, GRID, 0.9).strokeRoundedRect(p.x, p.y, q.x - p.x, q.y - p.y, 5);
    }

    private drawBins() {
      for (const component of packageComponents) {
        const point = this.project(component.x, component.y); const s = this.projection().scale; const carried = this.state.carriedComponentId === component.id;
        drawDie(this.graphics, point.x, point.y, TYPE_COLORS[component.type], s, carried ? 0.35 : 1, component.type === "hbm");
      }
    }

    private drawSubstrate() {
      const tl = this.project(445, 210); const br = this.project(845, 500); const s = this.projection().scale;
      this.graphics?.fillStyle(0x604a26, 0.48).fillRoundedRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y, 12); this.graphics?.lineStyle(2, 0xd8b05d, 0.65).strokeRoundedRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y, 12);

      const components = this.state.slots.map((id) => getPackageComponent(id));
      const neighborPairs = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]] as const;
      for (const [aIndex, bIndex] of neighborPairs) {
        const left = components[aIndex]; const right = components[bIndex]; if (!left || !right) continue;
        const a = this.project(packageSlotPositions[aIndex].x, packageSlotPositions[aIndex].y); const b = this.project(packageSlotPositions[bIndex].x, packageSlotPositions[bIndex].y);
        const usefulLink = (left.type === "compute" && right.bandwidth > 0) || (right.type === "compute" && left.bandwidth > 0);
        this.graphics?.lineStyle(Math.max(1, 3 * s), usefulLink ? CYAN : 0x7a6b4a, usefulLink ? 0.85 : 0.45).lineBetween(a.x, a.y, b.x, b.y);
      }

      packageSlotPositions.forEach((slot, index) => {
        const point = this.project(slot.x, slot.y); const component = components[index];
        this.graphics?.fillStyle(0x0a1112, 0.72).fillRoundedRect(point.x - 48 * s, point.y - 42 * s, 96 * s, 84 * s, 8);
        this.graphics?.lineStyle(Math.max(1, 1.8 * s), component ? TYPE_COLORS[component.type] : 0xb18e49, component ? 0.95 : 0.42).strokeRoundedRect(point.x - 48 * s, point.y - 42 * s, 96 * s, 84 * s, 8);
        if (component) {
          if (component.thermal >= 20) { const radius = (22 + component.thermal * 0.45) * s; this.graphics?.fillStyle(RED, 0.08).fillCircle(point.x, point.y, radius); }
          if (component.cooling > 0) { this.graphics?.lineStyle(Math.max(1, 2 * s), CYAN, 0.5).strokeCircle(point.x, point.y, 36 * s); }
          drawDie(this.graphics, point.x, point.y, TYPE_COLORS[component.type], s * 1.05, 1, component.type === "hbm");
        }
      });
    }

    private drawStations() {
      this.drawStation(packagingLayout.inspect.x, packagingLayout.inspect.y, this.state.inspectionPass ? GREEN : PURPLE, this.state.inspectionPending ? 1.2 : 1);
      this.drawStation(packagingLayout.profile.x, packagingLayout.profile.y, CYAN, 1);
      this.drawStation(packagingLayout.ship.x, packagingLayout.ship.y, this.state.inspectionPass ? YELLOW : MUTED, this.state.inspectionPass ? 1.12 : 1);
    }

    private drawStation(x: number, y: number, color: number, emphasis: number) {
      const point = this.project(x, y); const s = this.projection().scale; const pulse = emphasis + Math.sin((this.visualElapsed + x) / 220) * 0.04;
      this.graphics?.fillStyle(color, 0.1).fillCircle(point.x, point.y, 40 * s * pulse); this.graphics?.lineStyle(Math.max(1.3, 2.2 * s), color, 0.8).strokeCircle(point.x, point.y, 40 * s * pulse);
      this.graphics?.fillStyle(0x071012, 1).fillRoundedRect(point.x - 22 * s, point.y - 11 * s, 44 * s, 22 * s, 4); this.graphics?.fillStyle(color, 0.85).fillRect(point.x - 14 * s, point.y - 2 * s, 28 * s, 4 * s);
    }

    private drawPlayer() {
      const point = this.project(this.state.playerX, this.state.playerY); const s = this.projection().scale; const bob = Math.sin(this.visualElapsed / 150) * 1.1 * s;
      this.graphics?.fillStyle(0x000000, 0.42).fillEllipse(point.x + 2 * s, point.y + 11 * s, 22 * s, 8 * s);
      this.graphics?.lineStyle(Math.max(1, 3 * s), INK, 1).lineBetween(point.x - 4 * s, point.y + 2 * s + bob, point.x - 6 * s, point.y + 14 * s); this.graphics?.lineStyle(Math.max(1, 3 * s), INK, 1).lineBetween(point.x + 4 * s, point.y + 2 * s + bob, point.x + 6 * s, point.y + 14 * s);
      this.graphics?.fillStyle(INK, 1).fillRoundedRect(point.x - 8 * s, point.y - 12 * s + bob, 16 * s, 18 * s, 5 * s); this.graphics?.fillStyle(0xf0c6a0, 1).fillCircle(point.x, point.y - 18 * s + bob, 6.5 * s);
      const carried = getPackageComponent(this.state.carriedComponentId); if (carried) drawDie(this.graphics, point.x, point.y - 39 * s, TYPE_COLORS[carried.type], s * 0.72, 1, carried.type === "hbm");
    }

    private interact() { if (!this.state || this.state.mode !== "playing") return; const result = interactPackagingLab(this.state); this.state = result.state; this.handleEvent(result.event); this.draw(); }

    private handleEvent(event: PackagingEvent) {
      if (event === "none" || event === "collision") return;
      if (event === "component_picked") { tone(480); bridge.emit("game_action", { action: "pick_component", component: this.state.carriedComponentId }); }
      else if (event === "component_placed") { tone(610); bridge.emit("game_action", { action: "place_component", occupied: packageStats(this.state).occupied }); }
      else if (event === "component_removed") tone(320);
      else if (event === "profile_changed") { tone(this.state.bondProfile === "fast" ? 760 : this.state.bondProfile === "gentle" ? 410 : 570); bridge.emit("game_action", { action: "bond_profile", profile: this.state.bondProfile }); }
      else if (event === "inspection_started") { tone(530, 0.09, 0.035); bridge.emit("game_action", { action: "inspection_started", profile: this.state.bondProfile }); bridge.setStatus("X-ray and reflow inspection running — keep moving while the package is evaluated"); }
      else if (event === "inspection_passed") { tone(840, 0.12, 0.045); bridge.emit("level_completed", { action: "inspection_pass", workload: getPackageSpec(this.state).id }); bridge.setStatus("Package passed inspection — move it to shipping"); }
      else if (event === "inspection_failed") { tone(170, 0.14, 0.045); bridge.emit("game_action", { action: "inspection_fail", stats: packageStats(this.state) }); bridge.setStatus("Inspection failed — rework placement, thermals, bandwidth, warpage, yield, or component mix"); }
      else if (event === "ship_blocked") { tone(210); bridge.setStatus("Shipping blocked — the package needs a passing inspection"); }
      else if (event === "package_shipped") { tone(930, 0.14, 0.05); bridge.emit("level_completed", { action: "package_shipped", packages: this.state.packagesShipped, score: packagingScore(this.state) }); bridge.setStatus(`Package shipped — next customer loaded · ${getPackageSpec(this.state).name}`); }
      else if (event === "job_missed") { tone(130, 0.16, 0.045); bridge.emit("game_action", { action: "missed_package", missed: this.state.missedJobs, reputation: this.state.reputation }); bridge.setStatus(`Customer packaging window missed — reputation ${this.state.reputation}`); }
      else if (event === "complete" || event === "failed") this.endRun(event === "failed");
    }

    private endRun(failed: boolean) {
      const score = packagingScore(this.state); bestScore = Math.max(bestScore, score); writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      bridge.emit("game_over", { score, packages_shipped: this.state.packagesShipped, missed_specs: this.state.missedJobs, reputation: this.state.reputation, failed });
      bridge.setStatus(`${failed ? "Packaging program cancelled" : "Packaging shift complete"} — ${this.state.packagesShipped} shipped · score ${score}`);
      this.endTitle?.destroy(); this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 32, failed ? "PROGRAM CANCELLED" : "SHIFT REVIEW", { color: "#e9f6f4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "28px", fontStyle: "bold", backgroundColor: "#071012f2", padding: { x: 18, y: 11 } }).setOrigin(0.5).setDepth(40);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 32, `${this.state.packagesShipped} packages · ${this.state.missedJobs} misses · rep ${this.state.reputation}\nScore ${score} · Best ${bestScore}\nPress R or Restart for a new packaging shift`, { color: "#9fb3b0", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", lineSpacing: 6, backgroundColor: "#071012f2", padding: { x: 18, y: 11 } }).setOrigin(0.5).setDepth(40);
    }

    private resetRun() { this.endTitle?.destroy(); this.endDetail?.destroy(); this.endTitle = undefined; this.endDetail = undefined; this.state = createPackagingState(); this.visualElapsed = 0; this.statusElapsed = 0; this.draw(); bridge.setStatus("Packaging Lab live — place chiplets on the substrate and make adjacency work for you"); bridge.emit("game_started", { mode: "walkable-advanced-packaging-lab", session_seconds: 300 }); }

    private handleResize() { this.hudRight?.setPosition(this.scale.width - 14, 12); this.specText?.setPosition(this.scale.width / 2, 12); this.prompt?.setPosition(this.scale.width / 2, this.scale.height - 11); this.detail?.setPosition(14, this.scale.height - 12); this.touchInteract?.setPosition(this.scale.width - 66, this.scale.height - 38); this.endTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 32); this.endDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 32); this.draw(); }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BG, scene: [PackagingLabScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("packaging-lab"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("packaging-lab"); bridge.setStatus("Packaging Lab resumed"); },
    restart() { game.scene.stop("packaging-lab"); game.scene.start("packaging-lab"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { for (const key of ["pkgX","pkgY","pkgCarried","pkgSlots","pkgPending","pkgInspected","pkgPass","pkgShipped","pkgProfile","pkgMeetsSpec","pkgMode"]) delete mount.dataset[key]; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}

function drawDie(graphics: Phaser.GameObjects.Graphics | undefined, x: number, y: number, color: number, scale: number, alpha: number, stacked = false) {
  if (!graphics) return;
  const width = Math.max(31, 45 * scale); const height = Math.max(23, 32 * scale);
  if (stacked) {
    graphics.fillStyle(color, 0.28 * alpha).fillRoundedRect(x - width / 2 + 5, y - height / 2 - 6, width, height, 4);
    graphics.fillStyle(color, 0.45 * alpha).fillRoundedRect(x - width / 2 + 3, y - height / 2 - 3, width, height, 4);
  }
  graphics.fillStyle(0x020607, 0.45 * alpha).fillRoundedRect(x - width / 2 + 3, y - height / 2 + 4, width, height, 4);
  graphics.fillStyle(color, 0.9 * alpha).fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
  graphics.fillStyle(0x071012, 0.76 * alpha).fillRoundedRect(x - width * 0.3, y - height * 0.24, width * 0.6, height * 0.48, 2);
  graphics.lineStyle(Math.max(1, scale), INK, 0.42 * alpha).strokeRoundedRect(x - width * 0.3, y - height * 0.24, width * 0.6, height * 0.48, 2);
}
