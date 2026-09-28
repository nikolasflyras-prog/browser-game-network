import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { flipLane, nextRailObstacle, railCollision, railDifficulty, railObstacleProfile, railPassScore, type RailLane, type RailObstacleKind } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x100c16;
const RAIL = 0x5e5668;
const PLAYER = 0xffd36e;
const OBSTACLE = 0xff6f8e;
const PLAYER_RADIUS = 11;
const EXPRESS = 0x72d7ff;
const FREIGHT = 0xffbd66;
const RAIL_TIERS = ["COMMUTER LINE", "EXPRESS CORRIDOR", "CONTROL NETWORK", "HYPERLOOP GRID"] as const;
function railTier(score: number) { return score >= 3200 ? 3 : score >= 1400 ? 2 : score >= 500 ? 1 : 0; }

type RailObstacle = { x: number; blockedLane: RailLane; kind: RailObstacleKind; passed: boolean; body: Phaser.GameObjects.Rectangle };
type Mode = "playing" | "gameover";

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;
  const tone = (frequency: number, duration = 0.06, volume = 0.03) => {
    if (muted || typeof window === "undefined") return;
    try { audioContext ??= new AudioContext(); const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration); } catch { /* optional */ }
  };

  class RailflipScene extends Phaser.Scene {
    private mode: Mode = "playing";
    private lane: RailLane = "lower";
    private player?: Phaser.GameObjects.Arc;
    private rails?: Phaser.GameObjects.Graphics;
    private obstacles: RailObstacle[] = [];
    private spawnElapsed = 0;
    private seed = 918273;
    private passed = 0;
    private score = 0;
    private streak = 0;
    private shield = 0;
    private visualElapsed = 0;
    private scoreLabel?: Phaser.GameObjects.Text;
    private streakLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;

    constructor() { super("railflip"); }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.rails = this.add.graphics();
      this.player = this.add.circle(0, 0, PLAYER_RADIUS, PLAYER).setStrokeStyle(3, 0xffffff, 0.35);
      this.scoreLabel = this.add.text(24, 18, "Score 0", { color: "#f7f3fb", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "21px", fontStyle: "bold" });
      this.streakLabel = this.add.text(24, 47, "Streak 0", { color: "#9b91a4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" });
      this.bestLabel = this.add.text(this.scale.width - 24, 20, `Best ${bestScore}`, { color: "#9b91a4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 26, "TAP / CLICK / SPACE TO FLIP RAILS", { color: "#9b91a4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);
      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.on("keydown-SPACE", () => this.flip("keyboard"));
      this.input.keyboard?.on("keydown-UP", () => this.setLane("upper", "keyboard"));
      this.input.keyboard?.on("keydown-DOWN", () => this.setLane("lower", "keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerdown", () => this.flip("pointer"));
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.mode !== "playing" || !this.player) return;
      const dt = Math.min(delta / 1000, 0.04); this.visualElapsed += delta; this.drawRails();
      const difficulty = railDifficulty(this.passed);
      this.spawnElapsed += delta;
      if (this.spawnElapsed >= difficulty.spawnMs) { this.spawnElapsed = 0; this.spawnObstacle(); }
      const playerX = this.scale.width * 0.22;
      this.player.setPosition(playerX, this.laneY(this.lane));
      const survivors: RailObstacle[] = [];
      for (const obstacle of this.obstacles) {
        const profile = railObstacleProfile(obstacle.kind); const widthNow = difficulty.obstacleWidth * profile.widthFactor;
        obstacle.x -= difficulty.speed * profile.speedFactor * dt;
        obstacle.body.setPosition(obstacle.x, this.laneY(obstacle.blockedLane)).setDisplaySize(widthNow, obstacle.kind === "freight" ? 52 : obstacle.kind === "express" ? 34 : 44);
        if (railCollision(this.lane, obstacle.blockedLane, obstacle.x, playerX, widthNow, PLAYER_RADIUS)) {
          if (this.shield > 0) { this.shield -= 1; obstacle.body.destroy(); bridge.emit("game_action", { action: "stabilizer_used", score: this.score, obstacle_kind: obstacle.kind }); bridge.setStatus("Stabilizer absorbed a rail hit"); tone(820, 0.1, 0.04); continue; }
          this.endRun(); return;
        }
        if (!obstacle.passed && obstacle.x + widthNow / 2 < playerX - PLAYER_RADIUS) {
          obstacle.passed = true; this.passed += 1; this.streak += 1; this.score = railPassScore(this.score, this.streak, obstacle.kind);
          this.scoreLabel?.setText(`Score ${this.score}`); this.streakLabel?.setText(`Streak ${this.streak}`);
          bridge.emit("level_completed", { obstacle: this.passed, obstacle_kind: obstacle.kind, score: this.score, streak: this.streak, lane: this.lane });
          bridge.setStatus(`${obstacle.kind.toUpperCase()} clear — ${this.passed} obstacles · streak ${this.streak} · ${this.score} points`);
          tone(520 + Math.min(260, this.streak * 10), 0.05, 0.026);
        }
        if (obstacle.x > -80) survivors.push(obstacle); else obstacle.body.destroy();
      }
      this.obstacles = survivors;
    }

    private spawnObstacle() {
      const spec = nextRailObstacle(this.seed); this.seed = spec.seed;
      const difficulty = railDifficulty(this.passed); const profile = railObstacleProfile(spec.kind); const color = spec.kind === "express" ? EXPRESS : spec.kind === "freight" ? FREIGHT : OBSTACLE;
      const body = this.add.rectangle(this.scale.width + 40, this.laneY(spec.blockedLane), difficulty.obstacleWidth * profile.widthFactor, spec.kind === "freight" ? 52 : spec.kind === "express" ? 34 : 44, color).setStrokeStyle(spec.kind === "barrier" ? 2 : 3, 0xffffff, spec.kind === "barrier" ? 0.28 : 0.48);
      this.obstacles.push({ x: this.scale.width + 40, blockedLane: spec.blockedLane, kind: spec.kind, passed: false, body });
      bridge.emit("level_started", { obstacle: this.passed + this.obstacles.length, blocked_lane: spec.blockedLane, obstacle_kind: spec.kind, current_lane: this.lane });
    }

    private flip(input: "keyboard" | "pointer") {
      if (this.mode === "gameover") { this.resetRun(); return; }
      this.setLane(flipLane(this.lane), input);
    }

    private setLane(lane: RailLane, input: "keyboard" | "pointer") {
      if (this.mode !== "playing" || lane === this.lane) return;
      this.lane = lane;
      this.player?.setY(this.laneY(lane));
      bridge.emit("game_action", { action: "flip_rail", lane, input, score: this.score, passed: this.passed });
      bridge.setStatus(`Flipped — ${lane.toUpperCase()} rail · ${this.score} points`);
      tone(lane === "upper" ? 620 : 390, 0.045, 0.022);
    }

    private laneY(lane: RailLane) { return this.scale.height * (lane === "upper" ? 0.36 : 0.68); }

    private drawRails() {
      if (!this.rails) return;
      this.rails.clear(); const tier = railTier(bestScore), pulse = 0.45 + 0.25 * Math.sin(this.visualElapsed / 310); this.rails.fillStyle(BACKGROUND, 1).fillRect(0, 0, this.scale.width, this.scale.height); this.rails.lineStyle(5, RAIL, 0.8);
      for (const lane of ["upper", "lower"] as const) { const y = this.laneY(lane); this.rails.beginPath(); this.rails.moveTo(0, y); this.rails.lineTo(this.scale.width, y); this.rails.strokePath(); }
      if (tier >= 1) { const center = (this.laneY("upper") + this.laneY("lower")) / 2; this.rails.lineStyle(2, EXPRESS, 0.10 + pulse * 0.08).lineBetween(0, center, this.scale.width, center); }
      if (tier >= 2) { for (let x = 20; x < this.scale.width; x += 88) { this.rails.fillStyle(FREIGHT, 0.08 + pulse * 0.05).fillCircle((x + this.visualElapsed * 0.08) % Math.max(1, this.scale.width), this.scale.height * 0.17, 4); } }
      this.rails.lineStyle(1, 0xffffff, 0.08);
      for (let x = 0; x < this.scale.width; x += 52) { this.rails.beginPath(); this.rails.moveTo(x, this.laneY("upper") - 9); this.rails.lineTo(x + 18, this.laneY("upper") + 9); this.rails.moveTo(x, this.laneY("lower") - 9); this.rails.lineTo(x + 18, this.laneY("lower") + 9); this.rails.strokePath(); }
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover"; const oldTier = railTier(bestScore); bestScore = Math.max(bestScore, this.score); const newTier = railTier(bestScore); writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore); this.bestLabel?.setText(`${RAIL_TIERS[newTier]} · Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, obstacles: this.passed, streak: this.streak, best_score: bestScore, rail_tier: newTier });
      if (newTier > oldTier) { bridge.emit("game_action", { action: "rail_tier_up", tier: newTier }); bridge.setStatus(`Rail network upgraded — ${RAIL_TIERS[newTier]} unlocked`); } else bridge.setStatus(`Rail hit — ${this.score} points · ${this.passed} clears · tap / Space to retry`); tone(120, 0.2, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, "RAIL HIT", { color: "#f7f3fb", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 25, `${this.score} points · ${this.passed} clears\nTap / Space / R to retry`, { color: "#9b91a4", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
    }

    private resetRun() {
      for (const obstacle of this.obstacles) obstacle.body.destroy(); this.obstacles = []; this.mode = "playing"; this.lane = "lower"; this.spawnElapsed = 820; this.seed = 918273; this.passed = 0; this.score = 0; this.streak = 0; this.shield = railTier(bestScore) >= 2 ? 1 : 0; this.visualElapsed = 0;
      this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined;
      this.player?.setPosition(this.scale.width * 0.22, this.laneY(this.lane)); this.scoreLabel?.setText("Score 0"); this.streakLabel?.setText(`Streak 0${this.shield ? " · Shield 1" : ""}`); this.bestLabel?.setText(`${RAIL_TIERS[railTier(bestScore)]} · Best ${bestScore}`); this.drawRails();
      bridge.setStatus(`Railflip live — ${RAIL_TIERS[railTier(bestScore)]} · blue express is fast, gold freight is wide`); bridge.emit("game_started", { mode: "endless", best_score: bestScore, rail_tier: railTier(bestScore), shield: this.shield });
    }

    private handleResize() {
      this.bestLabel?.setPosition(this.scale.width - 24, 20); this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 26); this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 20); this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 25); this.drawRails(); this.player?.setPosition(this.scale.width * 0.22, this.laneY(this.lane));
      for (const obstacle of this.obstacles) obstacle.body.setY(this.laneY(obstacle.blockedLane));
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [RailflipScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("railflip"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("railflip"); bridge.setStatus("Railflip resumed"); },
    restart() { game.scene.stop("railflip"); game.scene.start("railflip"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
