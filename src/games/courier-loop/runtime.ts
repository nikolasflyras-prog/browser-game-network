import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { advanceCourier, courierDifficulty, courierMap, courierTarget, createCourierState, type CourierState } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x091313;
const ROAD = 0x10201f;
const BUILDING = 0x21312e;
const DEPOT = 0x70d6aa;
const TARGET = 0xffcf66;
const PLAYER = 0xf5fbf7;
const DANGER = 0xff6c73;
const EXPRESS = 0x63c7ff;
const FRAGILE = 0xff8bc2;
const COURIER_TIERS = ["BIKE COURIER", "CITY VAN", "EXPRESS FLEET", "METRO DISPATCH"] as const;
function courierTier(score: number) { return score >= 9000 ? 3 : score >= 5000 ? 2 : score >= 2200 ? 1 : 0; }

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

  class CourierLoopScene extends Phaser.Scene {
    private state!: CourierState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private mapGraphics?: Phaser.GameObjects.Graphics;
    private player?: Phaser.GameObjects.Arc;
    private targetRing?: Phaser.GameObjects.Arc;
    private scoreLabel?: Phaser.GameObjects.Text;
    private clockLabel?: Phaser.GameObjects.Text;
    private missionLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;
    private statusElapsed = 0;

    constructor() {
      super("courier-loop");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.mapGraphics = this.add.graphics();
      this.player = this.add.circle(0, 0, 13, PLAYER).setDepth(3);
      this.targetRing = this.add.circle(0, 0, 24, TARGET, 0.12).setStrokeStyle(3, TARGET).setDepth(2);
      this.scoreLabel = this.add.text(22, 18, "Score 0", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", fontStyle: "bold" }).setDepth(5);
      this.clockLabel = this.add.text(22, 46, "45s", { color: "#9aaca6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setDepth(5);
      this.missionLabel = this.add.text(this.scale.width / 2, 22, "DELIVER PACKAGE", { color: "#ffcf66", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(5);
      this.bestLabel = this.add.text(this.scale.width - 22, 22, `Best ${bestScore}`, { color: "#9aaca6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(5);
      if (this.input.keyboard) {
        this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,R") as Record<string, Phaser.Input.Keyboard.Key>;
      }
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (!this.state || this.state.phase === "gameover") return;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));
      const pointer = this.input.activePointer;
      if (pointer?.isDown && this.player) {
        const dx = pointer.x - this.state.x;
        const dy = pointer.y - this.state.y;
        const d = Math.hypot(dx, dy);
        if (d > 18) { x = dx / d; y = dy / d; }
      }
      const result = advanceCourier(this.state, { x, y }, delta / 1000, this.scale.width, this.scale.height);
      this.state = result.state;
      this.syncVisuals();
      this.handleEvent(result.event);
      this.statusElapsed += delta;
      if (this.statusElapsed >= 500 && this.state.phase !== "gameover") {
        this.statusElapsed = 0;
        bridge.setStatus(`${this.state.phase === "delivery" ? "Delivering" : "Returning to depot"} · ${Math.ceil(this.state.timeLeft)}s · ${this.state.score} points`);
      }
    }

    private drawMap() {
      const graphics = this.mapGraphics;
      if (!graphics) return;
      graphics.clear();
      graphics.fillStyle(ROAD, 1);
      graphics.fillRect(0, 0, this.scale.width, this.scale.height);
      const map = courierMap(this.scale.width, this.scale.height);
      graphics.fillStyle(BUILDING, 1);
      for (const rect of map.obstacles) { graphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 10); graphics.lineStyle(1, 0x344843, 0.8).strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 10); for (let wx = rect.x + 16; wx < rect.x + rect.width - 8; wx += 24) for (let wy = rect.y + 18; wy < rect.y + rect.height - 10; wy += 28) graphics.fillStyle(0x8fb4a7, 0.16).fillRect(wx, wy, 8, 11); }
      graphics.lineStyle(2, 0x8da39c, 0.12); for (let y = 90; y < this.scale.height; y += 96) { for (let x = 20; x < this.scale.width; x += 54) graphics.lineBetween(x, y, Math.min(x + 24, this.scale.width), y); }
      const tier = courierTier(bestScore); if (tier >= 1) { graphics.fillStyle(0x18372d, 0.9).fillRoundedRect(this.scale.width * 0.035, this.scale.height * 0.1, this.scale.width * 0.13, this.scale.height * 0.18, 14); graphics.fillStyle(0x70d6aa, 0.18).fillCircle(this.scale.width * 0.1, this.scale.height * 0.19, 34); }
      if (tier >= 2) { const hubX = this.scale.width * 0.9, hubY = this.scale.height * 0.48; graphics.fillStyle(0x132329, 0.95).fillRoundedRect(hubX - 42, hubY - 52, 84, 104, 8); graphics.lineStyle(2, EXPRESS, 0.45).strokeRoundedRect(hubX - 42, hubY - 52, 84, 104, 8); for (let i = 0; i < 4; i++) graphics.fillStyle(EXPRESS, 0.3 + i * 0.1).fillRect(hubX - 28, hubY - 34 + i * 18, 56, 6); }
      graphics.fillStyle(DEPOT, 0.22);
      graphics.fillCircle(map.depot.x, map.depot.y, 30);
      graphics.lineStyle(2, DEPOT, 0.85);
      graphics.strokeCircle(map.depot.x, map.depot.y, 30);
      graphics.fillStyle(TARGET, 0.08);
      for (const destination of map.destinations) graphics.fillCircle(destination.x, destination.y, 18);
    }

    private syncVisuals() {
      this.player?.setPosition(this.state.x, this.state.y).setFillStyle(this.state.collisionCooldown > 0.45 ? DANGER : PLAYER);
      const target = courierTarget(this.state, this.scale.width, this.scale.height);
      this.targetRing?.setPosition(target.x, target.y).setStrokeStyle(3, this.state.phase === "pickup" ? DEPOT : TARGET).setFillStyle(this.state.phase === "pickup" ? DEPOT : TARGET, 0.12);
      this.scoreLabel?.setText(`Score ${this.state.score}`);
      this.clockLabel?.setText(`${Math.ceil(this.state.timeLeft)}s · ${this.state.deliveries} delivered`);
      const cargoName = this.state.cargoType === "express" ? "EXPRESS" : this.state.cargoType === "fragile" ? "FRAGILE" : "STANDARD";
      this.missionLabel?.setText(this.state.phase === "pickup" ? "RETURN TO DEPOT" : `${cargoName} · DELIVER #${this.state.deliveries + 1}`).setColor(this.state.cargoType === "express" ? "#63c7ff" : this.state.cargoType === "fragile" ? "#ff8bc2" : "#ffcf66");
      this.bestLabel?.setText(`${COURIER_TIERS[courierTier(bestScore)]} · Best ${bestScore}`);
      mount.dataset.courierX = this.state.x.toFixed(1);
      mount.dataset.courierY = this.state.y.toFixed(1);
      mount.dataset.courierPhase = this.state.phase;
      mount.dataset.courierCargo = this.state.cargoType;
    }

    private handleEvent(event: string) {
      if (event === "collision") {
        tone(145, 0.09, 0.04);
        bridge.emit("game_action", { action: "collision", score: this.state.score, time_left: Math.round(this.state.timeLeft) });
        bridge.setStatus(`Building hit — ${courierDifficulty(this.state.deliveries, this.state.cargoType).collisionPenaltySeconds.toFixed(2)}s penalty · ${Math.ceil(this.state.timeLeft)}s left`);
      } else if (event === "delivered") {
        tone(720, 0.11, 0.045);
        bridge.emit("level_completed", { deliveries: this.state.deliveries, score: this.state.score, time_left: Math.round(this.state.timeLeft) });
        bridge.setStatus(`Delivered ${this.state.cargoType.toUpperCase()} package ${this.state.deliveries} — return to depot for the next load`);
      } else if (event === "picked_up") {
        tone(510, 0.07, 0.035);
        bridge.emit("game_action", { action: "pickup", deliveries: this.state.deliveries, score: this.state.score });
        bridge.setStatus(`Package loaded — destination ${this.state.destinationIndex + 1} live`);
      } else if (event === "game_over") {
        this.endRun();
      }
    }

    private endRun() {
      const oldTier = courierTier(bestScore); bestScore = Math.max(bestScore, this.state.score); const newTier = courierTier(bestScore);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.state.score, deliveries: this.state.deliveries, best_score: bestScore, license_tier: newTier });
      if (newTier > oldTier) { bridge.emit("game_action", { action: "courier_license_up", tier: newTier }); bridge.setStatus(`Courier license upgraded — ${COURIER_TIERS[newTier]} unlocked`); }
      else bridge.setStatus(`Shift over — ${this.state.deliveries} deliveries · ${this.state.score} points · press R to retry`);
      tone(120, 0.22, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "SHIFT OVER", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${this.state.deliveries} deliveries · ${this.state.score} points\nPress R or Restart to run another shift`, { color: "#9aaca6", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(6);
    }

    private resetRun() {
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      const tier = courierTier(bestScore); this.state = createCourierState(this.scale.width, this.scale.height); this.state.timeLeft += tier * 2;
      this.statusElapsed = 0;
      this.drawMap();
      this.syncVisuals();
      bridge.setStatus(`Courier Loop live — ${COURIER_TIERS[tier]} · cargo types change speed, collision cost, and payout`);
      bridge.emit("game_started", { mode: "timed-delivery", best_score: bestScore, license_tier: tier });
    }

    private handleResize() {
      this.bestLabel?.setPosition(this.scale.width - 22, 22);
      this.missionLabel?.setPosition(this.scale.width / 2, 22);
      this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 18);
      this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28);
      this.resetRun();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [CourierLoopScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("courier-loop"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("courier-loop"); bridge.setStatus("Courier Loop resumed"); },
    restart() { game.scene.stop("courier-loop"); game.scene.start("courier-loop"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { delete mount.dataset.courierX; delete mount.dataset.courierY; delete mount.dataset.courierPhase; delete mount.dataset.courierCargo; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
