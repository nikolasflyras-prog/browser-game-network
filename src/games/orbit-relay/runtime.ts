import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  difficultyForRelay,
  initialSource,
  intersectsCapture,
  isOutsideBounds,
  movingTargetCenter,
  nextTargetBase,
  orbitPosition,
  scoreAfterRelay,
  stepPoint,
  tangentialVelocity,
  type OrbitRelayScore,
  type Vec2,
} from "./model";

const SAVE_VERSION = 1;
const PLAYER_RADIUS = 9;
const BACKGROUND = 0x101114;
const PAPER = 0xf5f3ed;
const MUTED_TEXT = 0x8e8c86;
const ACCENT = 0xd93a2f;
const PLAYER = 0xf1c75b;

type Mode = "orbiting" | "flying" | "gameover";

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.08, volume = 0.045) => {
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
      // Audio is enhancement only. Gameplay must continue if a browser blocks Web Audio.
    }
  };

  class OrbitRelayScene extends Phaser.Scene {
    private mode: Mode = "orbiting";
    private run: OrbitRelayScore = { relays: 0, score: 0, multiplier: 1 };
    private source: Vec2 = { x: 0, y: 0 };
    private targetBase: Vec2 = { x: 0, y: 0 };
    private targetPhase = 0.7;
    private orbitAngle = 0;
    private flightPosition: Vec2 = { x: 0, y: 0 };
    private flightVelocity: Vec2 = { x: 0, y: 0 };
    private elapsedSeconds = 0;

    private guides?: Phaser.GameObjects.Graphics;
    private sourceBody?: Phaser.GameObjects.Arc;
    private targetBody?: Phaser.GameObjects.Arc;
    private player?: Phaser.GameObjects.Arc;
    private scoreLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private multiplierLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;

    constructor() {
      super("orbit-relay");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.guides = this.add.graphics();
      this.sourceBody = this.add.circle(0, 0, 18, PAPER);
      this.targetBody = this.add.circle(0, 0, 16, ACCENT);
      this.player = this.add.circle(0, 0, PLAYER_RADIUS, PLAYER);

      this.scoreLabel = this.add.text(24, 20, "Score 0", {
        color: "#fffdf8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
      });
      this.multiplierLabel = this.add.text(24, 50, "x1.00", {
        color: "#f1c75b",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      });
      this.bestLabel = this.add.text(this.scale.width - 24, 22, `Best ${bestScore}`, {
        color: "#aaa69c",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
      }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 30, "TAP / CLICK / SPACE TO LAUNCH", {
        color: "#aaa69c",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      }).setOrigin(0.5);

      this.input.on("pointerdown", () => this.handleAction("pointer"));
      this.input.keyboard?.on("keydown-SPACE", () => this.handleAction("keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.handleResize, this);
      });

      this.resetRun();
    }

    update(_time: number, delta: number) {
      const dt = Math.min(delta / 1000, 0.035);
      this.elapsedSeconds += dt;
      const difficulty = difficultyForRelay(this.run.relays);
      const target = movingTargetCenter(
        this.targetBase,
        this.elapsedSeconds,
        difficulty.targetMotionAmplitude,
        difficulty.targetMotionSpeed,
        this.targetPhase,
      );

      if (this.mode === "orbiting") {
        this.orbitAngle += difficulty.orbitSpeed * dt;
        const position = orbitPosition(this.source, difficulty.orbitRadius, this.orbitAngle);
        this.player?.setPosition(position.x, position.y);
      } else if (this.mode === "flying") {
        this.flightPosition = stepPoint(this.flightPosition, this.flightVelocity, dt);
        this.player?.setPosition(this.flightPosition.x, this.flightPosition.y);
        if (intersectsCapture(this.flightPosition, PLAYER_RADIUS, target, difficulty.targetRadius)) {
          this.completeRelay(target);
        } else if (isOutsideBounds(this.flightPosition, this.currentBounds())) {
          this.endRun();
        }
      }

      this.targetBody?.setPosition(target.x, target.y);
      this.drawGuides(target);
    }

    private currentBounds() {
      return { width: this.scale.width, height: this.scale.height };
    }

    private handleAction(inputType: "pointer" | "keyboard") {
      if (this.mode === "gameover") {
        this.resetRun();
        return;
      }
      if (this.mode !== "orbiting") return;

      const difficulty = difficultyForRelay(this.run.relays);
      this.flightPosition = orbitPosition(this.source, difficulty.orbitRadius, this.orbitAngle);
      this.flightVelocity = tangentialVelocity(this.orbitAngle, difficulty.launchSpeed, true);
      this.mode = "flying";
      this.instruction?.setText("CAPTURE THE RED RELAY");
      bridge.setStatus(`Relay ${this.run.relays + 1} in flight`);
      bridge.emit("level_started", {
        relay: this.run.relays + 1,
        input_type: inputType,
        multiplier: this.run.multiplier,
      });
      tone(230, 0.06, 0.035);
    }

    private completeRelay(target: Vec2) {
      this.run = scoreAfterRelay(this.run);
      if (this.run.score > bestScore) {
        bestScore = this.run.score;
        writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      }

      bridge.emit("level_completed", {
        relay: this.run.relays,
        score: this.run.score,
        multiplier: this.run.multiplier,
      });
      bridge.setStatus(`Relay ${this.run.relays} captured — keep the chain alive`);
      tone(620, 0.09, 0.05);

      this.source = { ...target };
      this.targetBase = nextTargetBase(this.source, this.currentBounds(), this.run.relays + 1);
      this.targetPhase = this.run.relays * 0.91 + 0.7;
      this.orbitAngle = this.source.x < this.scale.width / 2 ? 0 : Math.PI;
      this.mode = "orbiting";
      this.scoreLabel?.setText(`Score ${this.run.score}`);
      this.multiplierLabel?.setText(`x${this.run.multiplier.toFixed(2)} · ${this.run.relays} relay${this.run.relays === 1 ? "" : "s"}`);
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.instruction?.setText("TAP / CLICK / SPACE TO LAUNCH");
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover";
      bestScore = Math.max(bestScore, this.run.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      bridge.emit("game_over", {
        score: this.run.score,
        relays: this.run.relays,
        multiplier: this.run.multiplier,
        best_score: bestScore,
      });
      bridge.setStatus(`Run over — ${this.run.score} points · tap or press Space to retry`);
      tone(135, 0.22, 0.055);

      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 28, "ORBIT LOST", {
        color: "#fffdf8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 14,
        `${this.run.score} points · ${this.run.relays} relays\nTap / Space to run it again`,
        {
          color: "#aaa69c",
          align: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "15px",
          lineSpacing: 7,
        },
      ).setOrigin(0.5);
      this.instruction?.setText("R ALSO RESTARTS");
    }

    private resetRun() {
      this.run = { relays: 0, score: 0, multiplier: 1 };
      this.mode = "orbiting";
      this.elapsedSeconds = 0;
      this.orbitAngle = 0;
      this.source = initialSource(this.currentBounds());
      this.targetBase = nextTargetBase(this.source, this.currentBounds(), 1);
      this.targetPhase = 0.7;
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      this.scoreLabel?.setText("Score 0");
      this.multiplierLabel?.setText("x1.00 · 0 relays");
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.instruction?.setText("TAP / CLICK / SPACE TO LAUNCH");
      this.layoutStaticObjects();
      bridge.setStatus("Orbiting — launch when the tangent points at the red relay");
      bridge.emit("game_started", { mode: "standard", best_score: bestScore });
    }

    private drawGuides(target: Vec2) {
      const graphics = this.guides;
      const player = this.player;
      if (!graphics || !player) return;
      const difficulty = difficultyForRelay(this.run.relays);
      graphics.clear();

      graphics.lineStyle(1, MUTED_TEXT, 0.34);
      graphics.strokeCircle(this.source.x, this.source.y, difficulty.orbitRadius);
      graphics.lineStyle(2, ACCENT, 0.38);
      graphics.strokeCircle(target.x, target.y, difficulty.targetRadius);

      if (this.mode === "orbiting") {
        const velocity = tangentialVelocity(this.orbitAngle, 92, true);
        graphics.lineStyle(2, PAPER, 0.28);
        graphics.beginPath();
        graphics.moveTo(player.x, player.y);
        graphics.lineTo(player.x + velocity.x, player.y + velocity.y);
        graphics.strokePath();
      }
    }

    private handleResize() {
      if (this.mode === "gameover") {
        this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 28);
        this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 14);
      }
      const left = this.run.relays % 2 === 0;
      const anchor = initialSource(this.currentBounds());
      this.source = {
        x: left ? anchor.x : this.scale.width - anchor.x,
        y: this.scale.height * 0.5,
      };
      this.targetBase = nextTargetBase(this.source, this.currentBounds(), this.run.relays + 1);
      this.layoutStaticObjects();
    }

    private layoutStaticObjects() {
      this.sourceBody?.setPosition(this.source.x, this.source.y);
      this.bestLabel?.setPosition(this.scale.width - 24, 22);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 30);
      if (this.mode === "orbiting") {
        const difficulty = difficultyForRelay(this.run.relays);
        const position = orbitPosition(this.source, difficulty.orbitRadius, this.orbitAngle);
        this.player?.setPosition(position.x, position.y);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [OrbitRelayScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
  });

  return {
    pause() {
      game.scene.pause("orbit-relay");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("orbit-relay");
      bridge.setStatus("Orbit Relay resumed");
    },
    restart() {
      game.scene.stop("orbit-relay");
      game.scene.start("orbit-relay");
    },
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
    },
    destroy() {
      game.destroy(true);
      void audioContext?.close();
      audioContext = null;
    },
  };
}
