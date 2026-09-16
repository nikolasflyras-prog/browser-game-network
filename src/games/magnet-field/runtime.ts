import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { advanceMagnet, createMagnetState, magnetCoreRadius, magnetFieldRadius, type MagnetState } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0b1018;
const GRID = 0x182333;
const CORE = 0xf6fbff;
const FIELD = 0x65c8ff;
const SCRAP = 0x78e6b4;
const BOMB = 0xff6675;

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.06, volume = 0.03) => {
    if (muted || typeof window === "undefined") return;
    try {
      audioContext ??= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Audio is optional.
    }
  };

  class MagnetFieldScene extends Phaser.Scene {
    private state!: MagnetState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private grid?: Phaser.GameObjects.Graphics;
    private fieldRing?: Phaser.GameObjects.Arc;
    private core?: Phaser.GameObjects.Arc;
    private particles = new Map<number, Phaser.GameObjects.Arc>();
    private scoreLabel?: Phaser.GameObjects.Text;
    private energyLabel?: Phaser.GameObjects.Text;
    private livesLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;
    private statusElapsed = 0;

    constructor() { super("magnet-field"); }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.grid = this.add.graphics();
      this.fieldRing = this.add.circle(0, 0, magnetFieldRadius, FIELD, 0.035).setStrokeStyle(2, FIELD, 0.25).setDepth(1);
      this.core = this.add.circle(0, 0, magnetCoreRadius, CORE).setStrokeStyle(4, FIELD, 0.8).setDepth(3);
      this.scoreLabel = this.add.text(22, 18, "Score 0", { color: "#f6fbff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", fontStyle: "bold" }).setDepth(5);
      this.energyLabel = this.add.text(22, 46, "Field 100%", { color: "#8fa4b8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setDepth(5);
      this.livesLabel = this.add.text(this.scale.width / 2, 22, "Lives 3", { color: "#ff8a96", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(5);
      this.bestLabel = this.add.text(this.scale.width - 22, 22, `Best ${bestScore}`, { color: "#8fa4b8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(5);
      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (!this.state || this.state.mode === "gameover") return;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));
      let active = Boolean(this.keys.SPACE?.isDown);
      const pointer = this.input.activePointer;
      if (pointer?.isDown) {
        active = true;
        const dx = pointer.x - this.state.magnetX; const dy = pointer.y - this.state.magnetY; const d = Math.hypot(dx, dy);
        if (d > 18) { x = dx / d; y = dy / d; }
      }
      const result = advanceMagnet(this.state, { x, y, active }, delta / 1000, this.scale.width, this.scale.height);
      this.state = result.state;
      this.syncVisuals(active && this.state.energy > 0.5);
      this.handleEvents(result.events);
      this.statusElapsed += delta;
      if (this.statusElapsed >= 500 && this.state.mode !== "gameover") {
        this.statusElapsed = 0;
        bridge.setStatus(`${active ? "Field ON" : "Field idle"} · ${Math.round(this.state.energy)}% energy · ${this.state.score} points`);
      }
    }

    private drawGrid() {
      const graphics = this.grid; if (!graphics) return; graphics.clear(); graphics.lineStyle(1, GRID, 0.65);
      for (let x = 0; x <= this.scale.width; x += 48) { graphics.beginPath(); graphics.moveTo(x, 0); graphics.lineTo(x, this.scale.height); graphics.strokePath(); }
      for (let y = 0; y <= this.scale.height; y += 48) { graphics.beginPath(); graphics.moveTo(0, y); graphics.lineTo(this.scale.width, y); graphics.strokePath(); }
    }

    private syncVisuals(fieldActive: boolean) {
      this.core?.setPosition(this.state.magnetX, this.state.magnetY);
      this.fieldRing?.setPosition(this.state.magnetX, this.state.magnetY).setAlpha(fieldActive ? 1 : 0.16);
      const liveIds = new Set<number>();
      for (const particle of this.state.particles) {
        liveIds.add(particle.id);
        let view = this.particles.get(particle.id);
        if (!view) { view = this.add.circle(particle.x, particle.y, particle.kind === "bomb" ? 9 : 7, particle.kind === "bomb" ? BOMB : SCRAP).setDepth(2); this.particles.set(particle.id, view); }
        view.setPosition(particle.x, particle.y).setFillStyle(particle.kind === "bomb" ? BOMB : SCRAP);
      }
      for (const [id, view] of this.particles) if (!liveIds.has(id)) { view.destroy(); this.particles.delete(id); }
      this.scoreLabel?.setText(`Score ${this.state.score} · x${Math.max(1, this.state.combo)}`);
      this.energyLabel?.setText(`Field ${Math.round(this.state.energy)}%`);
      this.livesLabel?.setText(`Lives ${this.state.lives}`);
      this.bestLabel?.setText(`Best ${bestScore}`);
      mount.dataset.magnetX = this.state.magnetX.toFixed(1);
      mount.dataset.magnetEnergy = this.state.energy.toFixed(1);
      mount.dataset.magnetScore = String(this.state.score);
    }

    private handleEvents(events: string[]) {
      for (const event of events) {
        if (event === "scrap") { tone(660 + Math.min(180, this.state.combo * 12), 0.055, 0.028); bridge.emit("game_action", { action: "scrap_collected", score: this.state.score, combo: this.state.combo }); }
        else if (event === "bomb") { tone(150, 0.14, 0.05); bridge.emit("game_action", { action: "bomb_hit", lives: this.state.lives, score: this.state.score }); bridge.setStatus(`Bomb pulled into the core — ${this.state.lives} lives remain`); }
        else if (event === "game_over") this.endRun();
      }
    }

    private endRun() {
      bestScore = Math.max(bestScore, this.state.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.state.score, best_score: bestScore, elapsed_seconds: Math.round(this.state.elapsed) });
      bridge.setStatus(`Core lost — ${this.state.score} points · press R to retry`);
      tone(105, 0.24, 0.06);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "CORE LOST", { color: "#f6fbff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${this.state.score} points\nMove with WASD · hold Space to attract`, { color: "#8fa4b8", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(7);
    }

    private resetRun() {
      this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined;
      for (const view of this.particles.values()) view.destroy(); this.particles.clear();
      this.state = createMagnetState(this.scale.width, this.scale.height);
      this.statusElapsed = 0; this.drawGrid(); this.syncVisuals(false);
      bridge.setStatus("Magnet Field live — move with WASD/arrows, hold Space or touch to attract");
      bridge.emit("game_started", { mode: "endless-field", best_score: bestScore });
    }

    private handleResize() {
      this.bestLabel?.setPosition(this.scale.width - 22, 22);
      this.livesLabel?.setPosition(this.scale.width / 2, 22);
      this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 18);
      this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28);
      this.resetRun();
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [MagnetFieldScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("magnet-field"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("magnet-field"); bridge.setStatus("Magnet Field resumed"); },
    restart() { game.scene.stop("magnet-field"); game.scene.start("magnet-field"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { delete mount.dataset.magnetX; delete mount.dataset.magnetEnergy; delete mount.dataset.magnetScore; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
