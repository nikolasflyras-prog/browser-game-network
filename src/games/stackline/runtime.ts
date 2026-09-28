import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { resolveStackDrop, stackDifficulty, stackRecoveryWidth, stackSpawnX } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0a1010;
const PLATFORM = 0xe9f2ec;
const ACTIVE = 0x75e3ae;
const PERFECT = 0xffd36e;
const BLOCK_HEIGHT = 27;
const START_WIDTH = 190;
const STACK_TIERS = ["WORKSHOP", "MIDRISE SITE", "SKYSCRAPER CREW", "MEGATOWER"] as const;
function stackTier(score: number) { return score >= 7000 ? 3 : score >= 3200 ? 2 : score >= 1200 ? 1 : 0; }

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
    private perfectStreak = 0;
    private maxPlatformWidth = START_WIDTH;
    private field?: Phaser.GameObjects.Graphics;
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
      this.field = this.add.graphics().setDepth(0);
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

      this.perfectStreak = result.perfect ? this.perfectStreak + 1 : 0;
      const recoveredWidth = stackRecoveryWidth(result.width, this.maxPlatformWidth, this.perfectStreak);
      const landed = this.active;
      landed.setPosition(result.x, this.activeY).setDisplaySize(recoveredWidth, BLOCK_HEIGHT).setFillStyle(result.perfect ? PERFECT : PLATFORM);
      const block: StackBlock = { x: result.x, y: this.activeY, width: recoveredWidth, body: landed };
      this.stack.push(block);
      this.active = undefined;
      this.level += 1;
      this.score += result.points + (result.perfect ? Math.min(30, this.perfectStreak * 3) : 0);
      this.scoreLabel?.setText(`Score ${this.score}`);
      this.heightLabel?.setText(`Height ${this.level}`);
      bridge.emit("level_completed", { height: this.level, score: this.score, width: Math.round(recoveredWidth), perfect: result.perfect, perfect_streak: this.perfectStreak });
      bridge.setStatus(`${result.perfect ? `Perfect x${this.perfectStreak}` : "Stacked"} — height ${this.level} · ${Math.round(recoveredWidth)} width · ${this.score} points`);
      tone(result.perfect ? 760 : 520 + Math.min(180, this.level * 6), result.perfect ? 0.11 : 0.065, 0.035);

      this.drawBackdrop();
      if (block.y < 142) this.scrollStackDown();
      this.spawnActive();
    }

    private drawBackdrop() {
      const g = this.field; if (!g) return; const tier = stackTier(bestScore), width = this.scale.width, height = this.scale.height; g.clear();
      g.fillStyle(BACKGROUND, 1).fillRect(0, 0, width, height);
      g.lineStyle(1, 0x375044, 0.12); for (let y = 90; y < height - 55; y += 48) g.lineBetween(0, y, width, y);
      const ground = height - 58; g.fillStyle(0x111b17, 0.95).fillRect(0, ground, width, 58);
      for (let i = 0; i < 5 + tier * 2; i++) { const bw = 48 + (i % 3) * 18, bh = 45 + ((i * 37) % Math.max(60, Math.floor(height * 0.3))); const x = (i * 113 + 24) % Math.max(1, width); g.fillStyle(0x15251f, 0.55 + tier * 0.06).fillRect(x, ground - bh, bw, bh); for (let wy = ground - bh + 14; wy < ground - 8; wy += 22) for (let wx = x + 10; wx < x + bw - 6; wx += 18) g.fillStyle(PERFECT, 0.08 + (i % 2) * 0.04).fillRect(wx, wy, 5, 8); }
      if (tier >= 1) { const craneX = width * 0.82; g.lineStyle(3, ACTIVE, 0.18).lineBetween(craneX, 88, craneX, ground); g.lineBetween(craneX - 110, 106, craneX + 65, 106); g.lineStyle(1.5, ACTIVE, 0.18).lineBetween(craneX - 70, 106, craneX - 70, 175); }
      if (tier >= 2) { g.lineStyle(2, PERFECT, 0.1).strokeRoundedRect(14, 72, Math.max(10, width - 28), Math.max(10, height - 132), 12); }
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
      const oldTier = stackTier(bestScore); bestScore = Math.max(bestScore, this.score); const newTier = stackTier(bestScore);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`${STACK_TIERS[newTier]} · Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, height: this.level, best_score: bestScore, site_tier: newTier });
      if (newTier > oldTier) { bridge.emit("game_action", { action: "site_tier_up", tier: newTier }); bridge.setStatus(`Construction site upgraded — ${STACK_TIERS[newTier]} unlocked`); } else bridge.setStatus(`Tower lost — ${this.level} high · ${this.score} points · tap or press Space to retry`);
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
      this.perfectStreak = 0;
      this.maxPlatformWidth = START_WIDTH + stackTier(bestScore) * 8;
      this.direction = -1;
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      const baseY = this.scale.height - 86;
      const base = this.add.rectangle(this.scale.width / 2, baseY, this.maxPlatformWidth, BLOCK_HEIGHT, PLATFORM);
      this.stack.push({ x: this.scale.width / 2, y: baseY, width: this.maxPlatformWidth, body: base });
      this.scoreLabel?.setText("Score 0");
      this.heightLabel?.setText("Height 0");
      this.bestLabel?.setText(`${STACK_TIERS[stackTier(bestScore)]} · Best ${bestScore}`);
      this.instruction?.setText("3+ PERFECT DROPS REBUILD PLATFORM WIDTH");
      this.drawBackdrop(); this.spawnActive();
      bridge.setStatus(`Stackline live — ${STACK_TIERS[stackTier(bestScore)]} · build perfect streaks to recover width`);
      bridge.emit("game_started", { mode: "endless", best_score: bestScore, site_tier: stackTier(bestScore) });
    }

    private handleResize() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.bestLabel?.setPosition(width - 24, 22);
      this.instruction?.setPosition(width / 2, height - 26);
      this.gameOverTitle?.setPosition(width / 2, height / 2 - 20);
      this.gameOverDetail?.setPosition(width / 2, height / 2 + 26);
      this.drawBackdrop();
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
