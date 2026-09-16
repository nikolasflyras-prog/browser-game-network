import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { resolveStackDrop, stackDifficulty, stackSpawnX } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0a1010;
const PLATFORM = 0xe9f2ec;
const ACTIVE = 0x75e3ae;
const PERFECT = 0xffd36e;
const BLOCK_HEIGHT = 27;
const START_WIDTH = 190;

type StackBlock = {
  x: number;
  y: number;
  width: number;
  body: Phaser.GameObjects.Rectangle;
};

type Mode = "playing" | "gameover";

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.07, volume = 0.035) => {
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

  class StacklineScene extends Phaser.Scene {
    private mode: Mode = "playing";
    private stack: StackBlock[] = [];
    private active?: Phaser.GameObjects.Rectangle;
    private activeX = 0;
    private activeY = 0;
    private activeWidth = START_WIDTH;
    private direction: 1 | -1 = 1;
    private level = 0;
    private score = 0;
    private scoreLabel?: Phaser.GameObjects.Text;
    private heightLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;

    constructor() {
      super("stackline");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.scoreLabel = this.add.text(24, 20, "Score 0", { color: "#f4faf6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "21px", fontStyle: "bold" });
      this.heightLabel = this.add.text(24, 49, "Height 0", { color: "#8ea096", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" });
      this.bestLabel = this.add.text(this.scale.width - 24, 22, `Best ${bestScore}`, { color: "#8ea096", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 26, "TAP / CLICK / SPACE TO DROP", { color: "#8ea096", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);
      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.on("keydown-SPACE", () => this.drop());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerdown", () => this.drop());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.mode !== "playing" || !this.active) return;
      const dt = Math.min(delta / 1000, 0.04);
      const difficulty = stackDifficulty(this.level);
      this.activeX += this.direction * difficulty.speed * dt;
      const half = this.activeWidth / 2;
      if (this.activeX <= half + 8) { this.activeX = half + 8; this.direction = 1; }
      if (this.activeX >= this.scale.width - half - 8) { this.activeX = this.scale.width - half - 8; this.direction = -1; }
      this.active.setPosition(this.activeX, this.activeY);
    }

    private drop() {
      if (this.mode === "gameover") { this.resetRun(); return; }
      if (this.mode !== "playing" || !this.active) return;
      const base = this.stack.at(-1);
      if (!base) return;
      const result = resolveStackDrop(base.x, base.width, this.activeX, this.activeWidth, this.level);
      if (!result.hit) { this.endRun(); return; }

      const landed = this.active;
      landed.setPosition(result.x, this.activeY).setDisplaySize(result.width, BLOCK_HEIGHT).setFillStyle(result.perfect ? PERFECT : PLATFORM);
      const block: StackBlock = { x: result.x, y: this.activeY, width: result.width, body: landed };
      this.stack.push(block);
      this.active = undefined;
      this.level += 1;
      this.score += result.points;
      this.scoreLabel?.setText(`Score ${this.score}`);
      this.heightLabel?.setText(`Height ${this.level}`);
      bridge.emit("level_completed", { height: this.level, score: this.score, width: Math.round(result.width), perfect: result.perfect });
      bridge.setStatus(`${result.perfect ? "Perfect" : "Stacked"} — height ${this.level} · ${Math.round(result.width)} width · ${this.score} points`);
      tone(result.perfect ? 760 : 520 + Math.min(180, this.level * 6), result.perfect ? 0.11 : 0.065, 0.035);

      if (block.y < 142) this.scrollStackDown();
      this.spawnActive();
    }

    private scrollStackDown() {
      const shift = BLOCK_HEIGHT + 4;
      for (const block of this.stack) {
        block.y += shift;
        block.body.setY(block.y);
      }
    }

    private spawnActive() {
      const top = this.stack.at(-1);
      if (!top) return;
      this.direction = this.direction === 1 ? -1 : 1;
      this.activeWidth = top.width;
      this.activeY = top.y - BLOCK_HEIGHT - 4;
      this.activeX = stackSpawnX(this.direction, this.activeWidth, this.scale.width);
      this.active = this.add.rectangle(this.activeX, this.activeY, this.activeWidth, BLOCK_HEIGHT, ACTIVE);
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover";
      this.active?.setFillStyle(0xff7078);
      bestScore = Math.max(bestScore, this.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, height: this.level, best_score: bestScore });
      bridge.setStatus(`Tower lost — ${this.level} high · ${this.score} points · tap or press Space to retry`);
      tone(125, 0.2, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, "STACK LOST", { color: "#f4faf6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 26, `${this.score} points · height ${this.level}\nTap / Space / R to retry`, { color: "#8ea096", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
      this.instruction?.setText("DROP AGAIN TO RESTART");
    }

    private resetRun() {
      this.active?.destroy();
      for (const block of this.stack) block.body.destroy();
      this.stack = [];
      this.active = undefined;
      this.mode = "playing";
      this.level = 0;
      this.score = 0;
      this.direction = -1;
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      const baseY = this.scale.height - 86;
      const base = this.add.rectangle(this.scale.width / 2, baseY, START_WIDTH, BLOCK_HEIGHT, PLATFORM);
      this.stack.push({ x: this.scale.width / 2, y: baseY, width: START_WIDTH, body: base });
      this.scoreLabel?.setText("Score 0");
      this.heightLabel?.setText("Height 0");
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.instruction?.setText("TAP / CLICK / SPACE TO DROP");
      this.spawnActive();
      bridge.setStatus("Stackline live — drop the moving block with tap / Space");
      bridge.emit("game_started", { mode: "endless", best_score: bestScore });
    }

    private handleResize() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.bestLabel?.setPosition(width - 24, 22);
      this.instruction?.setPosition(width / 2, height - 26);
      this.gameOverTitle?.setPosition(width / 2, height / 2 - 20);
      this.gameOverDetail?.setPosition(width / 2, height / 2 + 26);
      if (this.stack.length === 1 && this.level === 0) this.resetRun();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [StacklineScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("stackline"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("stackline"); bridge.setStatus("Stackline resumed"); },
    restart() { game.scene.stop("stackline"); game.scene.start("stackline"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
