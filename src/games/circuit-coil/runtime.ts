import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { advanceCircuitCoil, coilStepSeconds, createCircuitCoilState, queueCoilDirection, type CircuitCoilState, type CoilDirection } from "./model";

const SAVE_VERSION = 1;
const COLS = 26;
const ROWS = 18;
const BACKGROUND = 0x07120f;
const GRID = 0x153029;
const BODY = 0x6fe3b5;
const HEAD = 0xf5fff9;
const FOOD = 0xffca62;

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false; let audioContext: AudioContext | null = null; let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;
  const tone = (frequency: number, duration = 0.05, volume = 0.025) => { if (muted || typeof window === "undefined") return; try { audioContext ??= new AudioContext(); const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.frequency.value = frequency; gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration); osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration); } catch { /* optional */ } };

  class CircuitCoilScene extends Phaser.Scene {
    private state!: CircuitCoilState;
    private graphics?: Phaser.GameObjects.Graphics;
    private scoreLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private hintLabel?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;
    private accumulator = 0;
    constructor() { super("circuit-coil"); }
    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND); this.graphics = this.add.graphics();
      this.scoreLabel = this.add.text(20, 16, "Nodes 0", { color: "#f5fff9", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", fontStyle: "bold" }).setDepth(4);
      this.bestLabel = this.add.text(this.scale.width - 20, 20, `Best ${bestScore}`, { color: "#8ba89d", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(4);
      this.hintLabel = this.add.text(this.scale.width / 2, this.scale.height - 20, "ARROWS / WASD · DO NOT CROSS YOUR TRAIL", { color: "#8ba89d", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5).setDepth(4);
      const bind = (key: string, direction: CoilDirection) => this.input.keyboard?.on(`keydown-${key}`, () => { if (this.state?.mode === "playing") this.state = queueCoilDirection(this.state, direction); });
      bind("UP", "up"); bind("W", "up"); bind("DOWN", "down"); bind("S", "down"); bind("LEFT", "left"); bind("A", "left"); bind("RIGHT", "right"); bind("D", "right");
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
      this.scale.on("resize", this.handleResize, this); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this)); this.resetRun();
    }
    update(_time: number, delta: number) {
      if (!this.state || this.state.mode === "gameover") return;
      this.accumulator += delta / 1000;
      const interval = coilStepSeconds(this.state.score);
      while (this.accumulator >= interval && this.state.mode === "playing") {
        this.accumulator -= interval; const result = advanceCircuitCoil(this.state, COLS, ROWS); this.state = result.state;
        if (result.event === "food") { tone(650 + Math.min(250, this.state.score * 12)); bridge.emit("game_action", { action: "node_collected", score: this.state.score, length: this.state.body.length }); bridge.setStatus(`Node ${this.state.score} captured — coil length ${this.state.body.length}`); }
        else if (result.event === "game_over") this.endRun();
      }
      this.draw();
    }
    private handlePointer(pointer: Phaser.Input.Pointer) {
      if (!this.state || this.state.mode !== "playing") return;
      const cell = this.cellSize(); const head = this.state.body[0]; const hx = this.offsetX(cell) + (head.x + 0.5) * cell; const hy = this.offsetY(cell) + (head.y + 0.5) * cell; const dx = pointer.x - hx; const dy = pointer.y - hy;
      const direction: CoilDirection = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down"); this.state = queueCoilDirection(this.state, direction);
    }
    private cellSize() { return Math.max(10, Math.min((this.scale.width - 36) / COLS, (this.scale.height - 82) / ROWS)); }
    private offsetX(cell: number) { return (this.scale.width - COLS * cell) / 2; }
    private offsetY(cell: number) { return Math.max(52, (this.scale.height - ROWS * cell) / 2); }
    private draw() {
      const graphics = this.graphics; if (!graphics) return; graphics.clear(); const cell = this.cellSize(); const ox = this.offsetX(cell); const oy = this.offsetY(cell);
      graphics.lineStyle(1, GRID, 0.52); for (let x = 0; x <= COLS; x += 1) { graphics.beginPath(); graphics.moveTo(ox + x * cell, oy); graphics.lineTo(ox + x * cell, oy + ROWS * cell); graphics.strokePath(); } for (let y = 0; y <= ROWS; y += 1) { graphics.beginPath(); graphics.moveTo(ox, oy + y * cell); graphics.lineTo(ox + COLS * cell, oy + y * cell); graphics.strokePath(); }
      this.state.body.forEach((segment, index) => { graphics.fillStyle(index === 0 ? HEAD : BODY, 1); graphics.fillRoundedRect(ox + segment.x * cell + 2, oy + segment.y * cell + 2, cell - 4, cell - 4, Math.max(2, cell * 0.18)); });
      graphics.fillStyle(FOOD, 1); graphics.fillCircle(ox + (this.state.food.x + 0.5) * cell, oy + (this.state.food.y + 0.5) * cell, Math.max(4, cell * 0.28));
      this.scoreLabel?.setText(`Nodes ${this.state.score} · Length ${this.state.body.length}`); this.bestLabel?.setText(`Best ${bestScore}`);
      const head = this.state.body[0]; mount.dataset.coilHeadX = String(head.x); mount.dataset.coilHeadY = String(head.y); mount.dataset.coilDirection = this.state.direction; mount.dataset.coilScore = String(this.state.score);
    }
    private endRun() {
      bestScore = Math.max(bestScore, this.state.score); writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore); bridge.emit("game_over", { score: this.state.score, length: this.state.body.length, best_score: bestScore }); bridge.setStatus(`Circuit broken — ${this.state.score} nodes · press R to retry`); tone(110, 0.22, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "CIRCUIT BROKEN", { color: "#f5fff9", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "29px", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${this.state.score} nodes · length ${this.state.body.length}\nPress R or Restart`, { color: "#8ba89d", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(6);
    }
    private resetRun() { this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined; this.accumulator = 0; this.state = createCircuitCoilState(COLS, ROWS); this.draw(); bridge.setStatus("Circuit Coil live — turn with arrows/WASD or tap toward the next direction"); bridge.emit("game_started", { mode: "endless-coil", best_score: bestScore }); }
    private handleResize() { this.bestLabel?.setPosition(this.scale.width - 20, 20); this.hintLabel?.setPosition(this.scale.width / 2, this.scale.height - 20); this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 18); this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28); this.draw(); }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [CircuitCoilScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return { pause() { game.scene.pause("circuit-coil"); bridge.setStatus("Paused"); }, resume() { game.scene.resume("circuit-coil"); bridge.setStatus("Circuit Coil resumed"); }, restart() { game.scene.stop("circuit-coil"); game.scene.start("circuit-coil"); }, setMuted(nextMuted: boolean) { muted = nextMuted; }, destroy() { delete mount.dataset.coilHeadX; delete mount.dataset.coilHeadY; delete mount.dataset.coilDirection; delete mount.dataset.coilScore; game.destroy(true); void audioContext?.close(); audioContext = null; } } satisfies GameRuntimeController;
}
