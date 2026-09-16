import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { circlesOverlap, particleSeeds, pulseRadius, roundConfig, roundScore, type Vec2 } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0d0b16;
const INK = 0xf7f3ff;
const MUTED = 0x948ca3;
const PARTICLE = 0x9f8cff;
const ACCENT = 0xffcc67;
const SUCCESS = 0x73dfad;
const PARTICLE_RADIUS = 6;

type Particle = Vec2 & {
  vx: number;
  vy: number;
  captured: boolean;
  body: Phaser.GameObjects.Arc;
};

type Pulse = Vec2 & {
  age: number;
  body: Phaser.GameObjects.Arc;
};

type Mode = "aiming" | "chain" | "transition" | "gameover";

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.08, volume = 0.035) => {
    if (muted || typeof window === "undefined") return;
    try {
      audioContext ??= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
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

  class PulseBloomScene extends Phaser.Scene {
    private particles: Particle[] = [];
    private pulses: Pulse[] = [];
    private mode: Mode = "aiming";
    private round = 1;
    private score = 0;
    private captured = 0;
    private chainElapsed = 0;
    private pointerPosition: Vec2 = { x: 0, y: 0 };
    private roundLabel?: Phaser.GameObjects.Text;
    private targetLabel?: Phaser.GameObjects.Text;
    private scoreLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private resultTitle?: Phaser.GameObjects.Text;
    private resultDetail?: Phaser.GameObjects.Text;

    constructor() {
      super("pulse-bloom");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.roundLabel = this.add.text(24, 18, "Round 1", { color: "#f7f3ff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", fontStyle: "bold" });
      this.targetLabel = this.add.text(24, 46, "Target 5", { color: "#948ca3", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" });
      this.scoreLabel = this.add.text(this.scale.width / 2, 20, "Score 0", { color: "#ffcc67", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "18px", fontStyle: "bold" }).setOrigin(0.5, 0);
      this.bestLabel = this.add.text(this.scale.width - 24, 20, `Best ${bestScore}`, { color: "#948ca3", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 28, "PLACE ONE PULSE — TAP / CLICK / SPACE", { color: "#948ca3", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);

      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => { this.pointerPosition = { x: pointer.x, y: pointer.y }; });
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handleAction({ x: pointer.x, y: pointer.y }));
      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.on("keydown-SPACE", () => this.handleAction(this.pointerPosition.x ? this.pointerPosition : { x: this.scale.width / 2, y: this.scale.height / 2 }));
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      const dt = Math.min(delta / 1000, 0.04);
      const width = this.scale.width;
      const height = this.scale.height;
      for (const particle of this.particles) {
        if (particle.captured) continue;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.x <= PARTICLE_RADIUS || particle.x >= width - PARTICLE_RADIUS) { particle.vx *= -1; particle.x = Math.max(PARTICLE_RADIUS, Math.min(width - PARTICLE_RADIUS, particle.x)); }
        if (particle.y <= 72 || particle.y >= height - 54) { particle.vy *= -1; particle.y = Math.max(72, Math.min(height - 54, particle.y)); }
        particle.body.setPosition(particle.x, particle.y);
      }

      if (this.mode !== "chain") return;
      this.chainElapsed += dt;
      const config = roundConfig(this.round);
      for (const pulse of this.pulses) {
        pulse.age += dt;
        const radius = pulseRadius(pulse.age, config.pulseDuration, config.maxPulseRadius);
        pulse.body.setRadius(radius).setAlpha(radius > 0 ? 0.2 + 0.5 * (radius / config.maxPulseRadius) : 0);
      }
      this.pulses = this.pulses.filter((pulse) => {
        if (pulse.age < config.pulseDuration) return true;
        pulse.body.destroy();
        return false;
      });

      for (const particle of this.particles) {
        if (particle.captured) continue;
        const hit = this.pulses.some((pulse) => circlesOverlap(particle, PARTICLE_RADIUS, pulse, pulseRadius(pulse.age, config.pulseDuration, config.maxPulseRadius)));
        if (hit) this.captureParticle(particle);
      }

      if (this.pulses.length === 0 && this.chainElapsed > 0.25) this.resolveRound();
    }

    private handleAction(point: Vec2) {
      if (this.mode === "gameover") { this.resetRun(); return; }
      if (this.mode !== "aiming") return;
      this.mode = "chain";
      this.chainElapsed = 0;
      this.addPulse(point.x, point.y);
      this.instruction?.setText("CHAIN REACTION LIVE");
      bridge.emit("level_started", { round: this.round, target: roundConfig(this.round).target, x: Math.round(point.x), y: Math.round(point.y) });
      bridge.setStatus(`Pulse placed — chain ${this.captured}/${roundConfig(this.round).target}`);
      tone(260, 0.07, 0.03);
    }

    private captureParticle(particle: Particle) {
      particle.captured = true;
      particle.body.setVisible(false);
      this.captured += 1;
      this.addPulse(particle.x, particle.y);
      this.targetLabel?.setText(`Captured ${this.captured} / target ${roundConfig(this.round).target}`);
      bridge.setStatus(`Chain growing — ${this.captured}/${roundConfig(this.round).target}`);
      tone(430 + Math.min(360, this.captured * 18), 0.055, 0.025);
    }

    private addPulse(x: number, y: number) {
      const body = this.add.circle(x, y, 1, ACCENT, 0.45).setStrokeStyle(2, ACCENT, 0.85);
      this.pulses.push({ x, y, age: 0.001, body });
    }

    private resolveRound() {
      if (this.mode !== "chain") return;
      const config = roundConfig(this.round);
      const gained = roundScore(this.round, this.captured, config.target);
      this.score += gained;
      this.scoreLabel?.setText(`Score ${this.score}`);
      if (this.captured >= config.target) {
        bridge.emit("level_completed", { round: this.round, captured: this.captured, target: config.target, points: gained, total_score: this.score });
        bridge.setStatus(`Round ${this.round} cleared — ${this.captured} captured`);
        tone(760, 0.12, 0.045);
        this.mode = "transition";
        this.resultTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 14, "BLOOM CLEARED", { color: "#73dfad", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "28px", fontStyle: "bold" }).setOrigin(0.5);
        this.resultDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 24, `${this.captured}/${config.particleCount} captured · +${gained}`, { color: "#948ca3", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px" }).setOrigin(0.5);
        this.time.delayedCall(850, () => { this.round += 1; this.startRound(); });
      } else {
        this.endRun(config.target);
      }
    }

    private endRun(target: number) {
      this.mode = "gameover";
      bestScore = Math.max(bestScore, this.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, round: this.round, captured: this.captured, target, best_score: bestScore });
      bridge.setStatus(`Bloom ended — ${this.captured}/${target} captured · tap or press Space to retry`);
      tone(140, 0.2, 0.05);
      this.resultTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "CHAIN BROKE", { color: "#f7f3ff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.resultDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 26, `${this.score} points · reached round ${this.round}\nTap / Space / R to retry`, { color: "#948ca3", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
      this.instruction?.setText("ONE SHOT PER ROUND");
    }

    private startRound() {
      for (const particle of this.particles) particle.body.destroy();
      for (const pulse of this.pulses) pulse.body.destroy();
      this.particles = [];
      this.pulses = [];
      this.resultTitle?.destroy();
      this.resultDetail?.destroy();
      this.resultTitle = undefined;
      this.resultDetail = undefined;
      this.captured = 0;
      this.chainElapsed = 0;
      this.mode = "aiming";
      const config = roundConfig(this.round);
      const seeds = particleSeeds(9000 + this.round * 137, config.particleCount, this.scale.width, this.scale.height);
      this.particles = seeds.map((seed) => ({ ...seed, captured: false, body: this.add.circle(seed.x, seed.y, PARTICLE_RADIUS, PARTICLE) }));
      this.roundLabel?.setText(`Round ${this.round}`);
      this.targetLabel?.setText(`Target ${config.target} of ${config.particleCount}`);
      this.scoreLabel?.setText(`Score ${this.score}`);
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.instruction?.setText("PLACE ONE PULSE — TAP / CLICK / SPACE");
      bridge.setStatus(`Round ${this.round} — capture ${config.target} with one pulse`);
    }

    private resetRun() {
      this.round = 1;
      this.score = 0;
      this.pointerPosition = { x: this.scale.width / 2, y: this.scale.height / 2 };
      this.startRound();
      bridge.emit("game_started", { mode: "chain", best_score: bestScore });
    }

    private handleResize() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.scoreLabel?.setPosition(width / 2, 20);
      this.bestLabel?.setPosition(width - 24, 20);
      this.instruction?.setPosition(width / 2, height - 28);
      this.resultTitle?.setPosition(width / 2, height / 2 - 18);
      this.resultDetail?.setPosition(width / 2, height / 2 + 26);
      for (const particle of this.particles) {
        particle.x = Math.max(PARTICLE_RADIUS, Math.min(width - PARTICLE_RADIUS, particle.x));
        particle.y = Math.max(72, Math.min(height - 54, particle.y));
        particle.body.setPosition(particle.x, particle.y);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [PulseBloomScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("pulse-bloom"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("pulse-bloom"); bridge.setStatus("Pulse Bloom resumed"); },
    restart() { game.scene.stop("pulse-bloom"); game.scene.start("pulse-bloom"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
