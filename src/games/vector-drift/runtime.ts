import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { circleHitsGate, clampPlayerX, difficultyForScore, gateClearScore, nextGate } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x091017;
const INK = 0xf5f7f8;
const MUTED = 0x8796a5;
const ACCENT = 0x60d7ff;
const DANGER = 0xff6d73;
const PLAYER_RADIUS = 12;

type Gate = {
  y: number;
  gapCenter: number;
  gapWidth: number;
  passed: boolean;
  left: Phaser.GameObjects.Rectangle;
  right: Phaser.GameObjects.Rectangle;
};

type Mode = "playing" | "gameover";

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.06, volume = 0.035) => {
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
      // Audio is optional.
    }
  };

  class VectorDriftScene extends Phaser.Scene {
    private mode: Mode = "playing";
    private gates: Gate[] = [];
    private player?: Phaser.GameObjects.Triangle;
    private scoreLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private score = 0;
    private gatesCleared = 0;
    private spawnElapsed = 0;
    private seed = 7331;
    private pointerTarget: number | null = null;

    constructor() {
      super("vector-drift");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.player = this.add.triangle(0, 0, 0, 26, 13, 0, 26, 26, ACCENT).setOrigin(0.5);
      this.scoreLabel = this.add.text(24, 20, "Score 0", { color: "#f5f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "22px", fontStyle: "bold" });
      this.bestLabel = this.add.text(this.scale.width - 24, 22, `Best ${bestScore}`, { color: "#8796a5", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 26, "STEER WITH ← → / A D / POINTER", { color: "#8796a5", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);

      this.cursors = this.input.keyboard?.createCursorKeys();
      this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => { this.pointerTarget = pointer.x; });
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) this.pointerTarget = pointer.x; });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.mode !== "playing" || !this.player) return;
      const dt = Math.min(delta / 1000, 0.04);
      const width = this.scale.width;
      const y = this.scale.height - 72;
      let nextX = this.player.x;
      const keyboardDirection = Number(Boolean(this.cursors?.right.isDown || this.keyD?.isDown)) - Number(Boolean(this.cursors?.left.isDown || this.keyA?.isDown));
      if (keyboardDirection !== 0) {
        this.pointerTarget = null;
        nextX += keyboardDirection * 330 * dt;
      } else if (this.pointerTarget !== null) {
        nextX += (this.pointerTarget - nextX) * Math.min(1, dt * 9);
      }
      nextX = clampPlayerX(nextX, width, PLAYER_RADIUS);
      this.player.setPosition(nextX, y);

      const difficulty = difficultyForScore(this.gatesCleared);
      this.spawnElapsed += delta;
      if (this.spawnElapsed >= difficulty.spawnMs) {
        this.spawnElapsed = 0;
        this.spawnGate();
      }

      for (const gate of this.gates) {
        gate.y += difficulty.gateSpeed * dt;
        this.layoutGate(gate);
        if (circleHitsGate(nextX, y, PLAYER_RADIUS, gate.y, 20, gate.gapCenter, gate.gapWidth)) {
          this.endRun();
          return;
        }
        if (!gate.passed && gate.y > y + 22) {
          gate.passed = true;
          this.gatesCleared += 1;
          this.score = gateClearScore(this.score, nextX, gate.gapCenter, gate.gapWidth);
          this.scoreLabel?.setText(`Score ${this.score}`);
          bridge.emit("level_completed", { gate: this.gatesCleared, score: this.score, speed: Math.round(difficulty.gateSpeed) });
          tone(520 + Math.min(300, this.gatesCleared * 8));
        }
      }

      const survivors: Gate[] = [];
      for (const gate of this.gates) {
        if (gate.y < this.scale.height + 40) survivors.push(gate);
        else { gate.left.destroy(); gate.right.destroy(); }
      }
      this.gates = survivors;
      bridge.setStatus(`Drifting — ${this.gatesCleared} gates · ${this.score} points`);
    }

    private spawnGate() {
      const spec = nextGate(this.seed, this.scale.width, this.gatesCleared);
      this.seed = spec.seed;
      const left = this.add.rectangle(0, -20, 10, 20, DANGER).setOrigin(0, 0.5);
      const right = this.add.rectangle(0, -20, 10, 20, DANGER).setOrigin(0, 0.5);
      const gate: Gate = { y: -20, gapCenter: spec.gapCenter, gapWidth: spec.gapWidth, passed: false, left, right };
      this.gates.push(gate);
      this.layoutGate(gate);
    }

    private layoutGate(gate: Gate) {
      const gapLeft = Math.max(0, gate.gapCenter - gate.gapWidth / 2);
      const gapRight = Math.min(this.scale.width, gate.gapCenter + gate.gapWidth / 2);
      gate.left.setPosition(0, gate.y).setSize(gapLeft, 20).setDisplaySize(gapLeft, 20);
      gate.right.setPosition(gapRight, gate.y).setSize(Math.max(0, this.scale.width - gapRight), 20).setDisplaySize(Math.max(0, this.scale.width - gapRight), 20);
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover";
      bestScore = Math.max(bestScore, this.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, gates: this.gatesCleared, best_score: bestScore });
      bridge.setStatus(`Drift ended — ${this.score} points · press R or Restart`);
      tone(120, 0.2, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 24, "VECTOR LOST", { color: "#f5f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 18, `${this.score} points · ${this.gatesCleared} gates\nPress R or use Restart`, { color: "#8796a5", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
      this.instruction?.setText("R TO RETRY");
    }

    private resetRun() {
      for (const gate of this.gates) { gate.left.destroy(); gate.right.destroy(); }
      this.gates = [];
      this.mode = "playing";
      this.score = 0;
      this.gatesCleared = 0;
      this.spawnElapsed = 520;
      this.seed = 7331;
      this.pointerTarget = null;
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      this.player?.setPosition(this.scale.width / 2, this.scale.height - 72);
      this.scoreLabel?.setText("Score 0");
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.instruction?.setText("STEER WITH ← → / A D / POINTER");
      bridge.setStatus("Vector Drift live — steer through the moving gates");
      bridge.emit("game_started", { mode: "endless", best_score: bestScore });
    }

    private handleResize() {
      const width = this.scale.width;
      const height = this.scale.height;
      if (this.player) this.player.setPosition(clampPlayerX(this.player.x || width / 2, width, PLAYER_RADIUS), height - 72);
      this.bestLabel?.setPosition(width - 24, 22);
      this.instruction?.setPosition(width / 2, height - 26);
      this.gameOverTitle?.setPosition(width / 2, height / 2 - 24);
      this.gameOverDetail?.setPosition(width / 2, height / 2 + 18);
      for (const gate of this.gates) {
        gate.gapCenter = clampPlayerX(gate.gapCenter, width, gate.gapWidth / 2 + 24);
        this.layoutGate(gate);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [VectorDriftScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("vector-drift"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("vector-drift"); bridge.setStatus("Vector Drift resumed"); },
    restart() { game.scene.stop("vector-drift"); game.scene.start("vector-drift"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
