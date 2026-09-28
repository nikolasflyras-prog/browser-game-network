import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { brickPattern, reboundDifficulty, reboundHitScore, reflectFromPaddle, type ReboundBrickKind } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x081018;
const BALL = 0xffd36e;
const PADDLE = 0x69d6ff;
const BRICK_COLORS = [0x8b82ff, 0x69d6ff, 0x77dfad, 0xff8daa, 0xffd36e, 0xb59cff];
const BALL_RADIUS = 8;
const CHARGE = 0x7de5ff;
const ARMORED = 0xd8dce5;
const REBOUND_TIERS = ["GARAGE TABLE", "ARCADE COURT", "PRO ARENA", "NEON LEAGUE"] as const;
function reboundTier(score: number) { return score >= 7000 ? 3 : score >= 3200 ? 2 : score >= 1200 ? 1 : 0; }

type Brick = { strength: number; kind: ReboundBrickKind; body: Phaser.GameObjects.Rectangle };
type Mode = "playing" | "gameover";

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
    } catch { /* enhancement only */ }
  };

  class ReboundRushScene extends Phaser.Scene {
    private mode: Mode = "playing";
    private paddle?: Phaser.GameObjects.Rectangle;
    private ball?: Phaser.GameObjects.Arc;
    private bricks: Brick[] = [];
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private ballVelocity = { vx: 150, vy: -250 };
    private pointerTarget: number | null = null;
    private wave = 1;
    private score = 0;
    private lives = 3;
    private maxLives = 3;
    private combo = 0;
    private powerTimer = 0;
    private field?: Phaser.GameObjects.Graphics;
    private scoreLabel?: Phaser.GameObjects.Text;
    private waveLabel?: Phaser.GameObjects.Text;
    private livesLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;

    constructor() { super("rebound-rush"); }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.field = this.add.graphics().setDepth(0);
      this.scoreLabel = this.add.text(24, 18, "Score 0", { color: "#f5f8fb", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "21px", fontStyle: "bold" });
      this.waveLabel = this.add.text(24, 47, "Wave 1", { color: "#93a1ae", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" });
      this.livesLabel = this.add.text(this.scale.width / 2, 20, "● ● ●", { color: "#ffd36e", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", fontStyle: "bold" }).setOrigin(0.5, 0);
      this.bestLabel = this.add.text(this.scale.width - 24, 20, `Best ${bestScore}`, { color: "#93a1ae", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 24, "← → / A D / MOVE POINTER", { color: "#93a1ae", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);
      this.cursors = this.input.keyboard?.createCursorKeys();
      this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => { this.pointerTarget = pointer.x; });
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => { this.pointerTarget = pointer.x; bridge.setStatus(`Paddle set — ${Math.round(pointer.x)} · wave ${this.wave}`); });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.mode !== "playing" || !this.paddle || !this.ball) return;
      const dt = Math.min(delta / 1000, 0.035);
      const width = this.scale.width;
      const height = this.scale.height;
      const difficulty = reboundDifficulty(this.wave); this.powerTimer = Math.max(0, this.powerTimer - dt);
      const paddleWidth = difficulty.paddleWidth + (this.powerTimer > 0 ? 56 : 0);
      let paddleX = this.paddle.x;
      const direction = Number(Boolean(this.cursors?.right.isDown || this.keyD?.isDown)) - Number(Boolean(this.cursors?.left.isDown || this.keyA?.isDown));
      if (direction !== 0) { this.pointerTarget = null; paddleX += direction * 410 * dt; }
      else if (this.pointerTarget !== null) paddleX += (this.pointerTarget - paddleX) * Math.min(1, dt * 11);
      const halfPaddle = paddleWidth / 2;
      paddleX = Phaser.Math.Clamp(paddleX, halfPaddle + 8, width - halfPaddle - 8);
      this.paddle.setPosition(paddleX, height - 58).setDisplaySize(paddleWidth, 16).setFillStyle(this.powerTimer > 0 ? CHARGE : PADDLE);

      this.ball.x += this.ballVelocity.vx * dt;
      this.ball.y += this.ballVelocity.vy * dt;
      if (this.ball.x <= BALL_RADIUS && this.ballVelocity.vx < 0) { this.ball.x = BALL_RADIUS; this.ballVelocity.vx *= -1; tone(310, 0.035, 0.018); }
      if (this.ball.x >= width - BALL_RADIUS && this.ballVelocity.vx > 0) { this.ball.x = width - BALL_RADIUS; this.ballVelocity.vx *= -1; tone(310, 0.035, 0.018); }
      if (this.ball.y <= 72 + BALL_RADIUS && this.ballVelocity.vy < 0) { this.ball.y = 72 + BALL_RADIUS; this.ballVelocity.vy *= -1; tone(330, 0.035, 0.018); }

      const paddleTop = this.paddle.y - 8;
      if (this.ballVelocity.vy > 0 && this.ball.y + BALL_RADIUS >= paddleTop && this.ball.y < this.paddle.y + 10 && Math.abs(this.ball.x - this.paddle.x) <= paddleWidth / 2 + BALL_RADIUS) {
        this.ball.y = paddleTop - BALL_RADIUS;
        this.ballVelocity = reflectFromPaddle(this.ball.x, this.paddle.x, paddleWidth, difficulty.ballSpeed);
        this.combo = 0;
        tone(430, 0.045, 0.025);
      }

      let hitIndex = -1;
      for (let index = 0; index < this.bricks.length; index += 1) {
        const bounds = this.bricks[index].body.getBounds();
        if (this.ball.x + BALL_RADIUS >= bounds.left && this.ball.x - BALL_RADIUS <= bounds.right && this.ball.y + BALL_RADIUS >= bounds.top && this.ball.y - BALL_RADIUS <= bounds.bottom) { hitIndex = index; break; }
      }
      if (hitIndex >= 0) this.hitBrick(hitIndex);
      if (this.ball.y - BALL_RADIUS > height) this.loseBall();
    }

    private hitBrick(index: number) {
      const brick = this.bricks[index];
      brick.strength -= 1;
      this.ballVelocity.vy *= -1;
      this.combo += 1;
      this.score += reboundHitScore(this.combo, 1);
      this.scoreLabel?.setText(`Score ${this.score}`);
      tone(540 + Math.min(260, this.combo * 12), 0.045, 0.025);
      if (brick.strength <= 0) { const kind = brick.kind; brick.body.destroy(); this.bricks.splice(index, 1); if (kind === "charge") { this.powerTimer = 6; this.score += 35; this.scoreLabel?.setText(`Score ${this.score}`); tone(880, 0.1, 0.04); bridge.emit("game_action", { action: "wide_paddle_charge", wave: this.wave, seconds: 6, score: this.score }); bridge.setStatus("Charge brick broken — paddle widened for 6 seconds"); } }
      else brick.body.setAlpha(0.52);
      bridge.emit("level_completed", { wave: this.wave, score: this.score, combo: this.combo, targets_remaining: this.bricks.length });
      if (this.bricks.length === 0) this.nextWave();
    }

    private loseBall() {
      this.lives -= 1;
      this.combo = 0;
      this.livesLabel?.setText(`${"● ".repeat(this.lives)}${"○ ".repeat(Math.max(0, this.maxLives - this.lives))}`.trim());
      bridge.emit("game_action", { action: "ball_lost", wave: this.wave, lives: this.lives, score: this.score });
      if (this.lives <= 0) { this.endRun(); return; }
      bridge.setStatus(`Ball lost — ${this.lives} lives · wave ${this.wave}`);
      tone(145, 0.14, 0.045);
      this.resetBall();
    }

    private nextWave() {
      this.wave += 1;
      this.score += 75 + this.wave * 10;
      this.waveLabel?.setText(`Wave ${this.wave}`);
      this.scoreLabel?.setText(`Score ${this.score}`);
      bridge.emit("game_action", { action: "wave_clear", wave: this.wave - 1, score: this.score });
      bridge.setStatus(`Wave ${this.wave - 1} cleared — wave ${this.wave} incoming`);
      tone(790, 0.12, 0.045);
      this.buildWave();
      this.resetBall();
    }

    private drawArena() {
      const g = this.field; if (!g) return; const tier = reboundTier(bestScore), width = this.scale.width, height = this.scale.height; g.clear();
      g.fillStyle(BACKGROUND, 1).fillRect(0, 0, width, height);
      g.lineStyle(1, 0x304050, 0.18); for (let x = 34; x < width; x += 54) g.lineBetween(x, 76, x, height - 40);
      for (let y = 94; y < height - 40; y += 46) g.lineBetween(0, y, width, y);
      if (tier >= 1) { g.lineStyle(2, PADDLE, 0.15).strokeRoundedRect(14, 78, Math.max(10, width - 28), Math.max(10, height - 118), 14); }
      if (tier >= 2) { for (let i = 0; i < 6 + tier; i++) { const x = 40 + i * Math.max(52, (width - 80) / (6 + tier)); g.fillStyle(CHARGE, 0.10 + (i % 3) * 0.04).fillCircle(x, 90, 4 + (i % 2)); } }
    }

    private buildWave() {
      this.drawArena();
      for (const brick of this.bricks) brick.body.destroy();
      this.bricks = [];
      const specs = brickPattern(this.wave);
      const columns = 8;
      const gap = 7;
      const usable = Math.min(this.scale.width - 32, 820);
      const brickWidth = (usable - gap * (columns - 1)) / columns;
      const startX = (this.scale.width - usable) / 2 + brickWidth / 2;
      for (const spec of specs) {
        const x = startX + spec.column * (brickWidth + gap);
        const y = 112 + spec.row * 32;
        const color = spec.kind === "charge" ? CHARGE : spec.kind === "armored" ? ARMORED : BRICK_COLORS[spec.row % BRICK_COLORS.length];
        const body = this.add.rectangle(x, y, brickWidth, 22, color, spec.kind === "normal" ? 0.82 : 1).setStrokeStyle(spec.kind === "charge" ? 2 : spec.kind === "armored" ? 2 : 0, spec.kind === "charge" ? 0xffffff : 0x8a93a2, spec.kind === "normal" ? 0 : 0.45);
        this.bricks.push({ strength: spec.strength, kind: spec.kind, body });
      }
    }

    private resetBall() {
      const difficulty = reboundDifficulty(this.wave);
      const angle = -Math.PI / 2 + (this.wave % 2 === 0 ? 0.34 : -0.34);
      this.ball?.setPosition(this.scale.width / 2, this.scale.height - 88);
      this.ballVelocity = { vx: Math.cos(angle) * difficulty.ballSpeed, vy: Math.sin(angle) * difficulty.ballSpeed };
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover";
      const oldTier = reboundTier(bestScore); bestScore = Math.max(bestScore, this.score); const newTier = reboundTier(bestScore);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`${REBOUND_TIERS[newTier]} · Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, wave: this.wave, best_score: bestScore, arena_tier: newTier });
      if (newTier > oldTier) { bridge.emit("game_action", { action: "arena_tier_up", tier: newTier }); bridge.setStatus(`Arena upgraded — ${REBOUND_TIERS[newTier]} unlocked`); } else bridge.setStatus(`Rebound over — ${this.score} points · wave ${this.wave} · press R or Restart`);
      tone(115, 0.22, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, "REBOUND LOST", { color: "#f5f8fb", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 25, `${this.score} points · wave ${this.wave}\nPress R or use Restart`, { color: "#93a1ae", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
    }

    private resetRun() {
      this.paddle?.destroy(); this.ball?.destroy(); for (const brick of this.bricks) brick.body.destroy();
      this.bricks = []; this.mode = "playing"; this.wave = 1; this.score = 0; this.maxLives = reboundTier(bestScore) >= 2 ? 4 : 3; this.lives = this.maxLives; this.combo = 0; this.powerTimer = 0; this.pointerTarget = null;
      this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined;
      this.paddle = this.add.rectangle(this.scale.width / 2, this.scale.height - 58, reboundDifficulty(1).paddleWidth, 16, PADDLE);
      this.ball = this.add.circle(this.scale.width / 2, this.scale.height - 88, BALL_RADIUS, BALL);
      this.scoreLabel?.setText("Score 0"); this.waveLabel?.setText("Wave 1"); this.livesLabel?.setText("● ".repeat(this.lives).trim()); this.bestLabel?.setText(`${REBOUND_TIERS[reboundTier(bestScore)]} · Best ${bestScore}`);
      this.buildWave(); this.resetBall();
      bridge.setStatus(`Rebound Rush live — ${REBOUND_TIERS[reboundTier(bestScore)]} · cyan charge bricks widen the paddle`);
      bridge.emit("game_started", { mode: "waves", best_score: bestScore, arena_tier: reboundTier(bestScore) });
    }

    private handleResize() {
      this.bestLabel?.setPosition(this.scale.width - 24, 20); this.livesLabel?.setPosition(this.scale.width / 2, 20); this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 24);
      this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 20); this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 25);
      if (this.mode === "playing") { this.buildWave(); this.resetBall(); }
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [ReboundRushScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("rebound-rush"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("rebound-rush"); bridge.setStatus("Rebound Rush resumed"); },
    restart() { game.scene.stop("rebound-rush"); game.scene.start("rebound-rush"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
