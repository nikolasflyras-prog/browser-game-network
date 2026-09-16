import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { laneFromIndex, laneIndex, nextSwitchTrain, resolveSwitchTrain, switchDifficulty, type SwitchLane } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0c1018;
const TRACK = 0x5e6876;
const ACTIVE_TRACK = 0xf5f7fa;
const LANE_COLORS: Record<SwitchLane, number> = { left: 0x60d7ff, center: 0xffd36e, right: 0xff7ca8 };
const LANE_LABELS: Record<SwitchLane, string> = { left: "1", center: "2", right: "3" };
const ROUTE_LOCK_PROGRESS = 0.58;

type Train = {
  progress: number;
  targetLane: SwitchLane;
  routedLane: SwitchLane | null;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
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

  class SwitchyardScene extends Phaser.Scene {
    private mode: Mode = "playing";
    private selectedLane: SwitchLane = "center";
    private trains: Train[] = [];
    private resolved = 0;
    private score = 0;
    private streak = 0;
    private lives = 3;
    private seed = 48271;
    private spawnElapsed = 0;
    private tracks?: Phaser.GameObjects.Graphics;
    private scoreLabel?: Phaser.GameObjects.Text;
    private livesLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private switchLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;

    constructor() {
      super("switchyard");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.tracks = this.add.graphics();
      this.scoreLabel = this.add.text(24, 18, "Score 0", { color: "#f5f7fa", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "21px", fontStyle: "bold" });
      this.livesLabel = this.add.text(24, 48, "Lives ● ● ●", { color: "#9aa5b4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" });
      this.bestLabel = this.add.text(this.scale.width - 24, 20, `Best ${bestScore}`, { color: "#9aa5b4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0);
      this.switchLabel = this.add.text(this.scale.width / 2, 22, "Switch 2", { color: "#ffd36e", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "17px", fontStyle: "bold" }).setOrigin(0.5, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 26, "1 / 2 / 3 · ← → · TAP A LANE", { color: "#9aa5b4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);
      this.input.keyboard?.on("keydown-ONE", () => this.setLane("left", "keyboard"));
      this.input.keyboard?.on("keydown-TWO", () => this.setLane("center", "keyboard"));
      this.input.keyboard?.on("keydown-THREE", () => this.setLane("right", "keyboard"));
      this.input.keyboard?.on("keydown-LEFT", () => this.setLane(laneFromIndex(laneIndex(this.selectedLane) - 1), "keyboard"));
      this.input.keyboard?.on("keydown-RIGHT", () => this.setLane(laneFromIndex(laneIndex(this.selectedLane) + 1), "keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        const third = this.scale.width / 3;
        this.setLane(pointer.x < third ? "left" : pointer.x < third * 2 ? "center" : "right", "pointer");
      });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.mode !== "playing") return;
      const dt = Math.min(delta / 1000, 0.04);
      const difficulty = switchDifficulty(this.resolved);
      this.spawnElapsed += delta;
      if (this.spawnElapsed >= difficulty.spawnMs) {
        this.spawnElapsed = 0;
        this.spawnTrain();
      }

      const remaining: Train[] = [];
      for (const train of this.trains) {
        const previous = train.progress;
        train.progress += difficulty.progressPerSecond * dt;
        if (previous < ROUTE_LOCK_PROGRESS && train.progress >= ROUTE_LOCK_PROGRESS) train.routedLane = this.selectedLane;
        this.positionTrain(train);
        if (train.progress >= 1) this.resolveTrain(train);
        else remaining.push(train);
      }
      this.trains = remaining;
    }

    private spawnTrain() {
      const spec = nextSwitchTrain(this.seed);
      this.seed = spec.seed;
      const color = LANE_COLORS[spec.lane];
      const body = this.add.rectangle(this.scale.width / 2, this.scale.height + 20, 38, 24, color).setStrokeStyle(2, 0xffffff, 0.45);
      const label = this.add.text(body.x, body.y, LANE_LABELS[spec.lane], { color: "#10131a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5);
      this.trains.push({ progress: 0, targetLane: spec.lane, routedLane: null, body, label });
      bridge.emit("level_started", { train: this.resolved + this.trains.length, target_lane: spec.lane, switch_lane: this.selectedLane });
      bridge.setStatus(`Train ${LANE_LABELS[spec.lane]} approaching · switch ${LANE_LABELS[this.selectedLane]} · ${this.lives} lives`);
    }

    private positionTrain(train: Train) {
      const width = this.scale.width;
      const height = this.scale.height;
      const junction = { x: width / 2, y: height * 0.58 };
      let x = junction.x;
      let y = height + 16;
      if (train.progress <= ROUTE_LOCK_PROGRESS) {
        const t = train.progress / ROUTE_LOCK_PROGRESS;
        y = Phaser.Math.Linear(height + 16, junction.y, t);
      } else {
        const lane = train.routedLane ?? this.selectedLane;
        const exitX = this.laneX(lane);
        const t = (train.progress - ROUTE_LOCK_PROGRESS) / (1 - ROUTE_LOCK_PROGRESS);
        x = Phaser.Math.Linear(junction.x, exitX, t);
        y = Phaser.Math.Linear(junction.y, 104, t);
      }
      train.body.setPosition(x, y);
      train.label.setPosition(x, y);
    }

    private resolveTrain(train: Train) {
      const routedLane = train.routedLane ?? this.selectedLane;
      const result = resolveSwitchTrain(this.score, this.streak, this.lives, train.targetLane, routedLane);
      this.score = result.score;
      this.streak = result.streak;
      this.lives = result.lives;
      this.resolved += 1;
      train.body.destroy();
      train.label.destroy();
      this.scoreLabel?.setText(`Score ${this.score}`);
      this.livesLabel?.setText(`Lives ${"● ".repeat(this.lives)}${"○ ".repeat(3 - this.lives)}`.trim());
      if (result.correct) {
        bridge.emit("level_completed", { train: this.resolved, target_lane: train.targetLane, routed_lane: routedLane, score: this.score, streak: this.streak });
        bridge.setStatus(`Correct route — ${LANE_LABELS[routedLane]} · streak ${this.streak} · ${this.score} points`);
        tone(610 + Math.min(180, this.streak * 12));
      } else {
        bridge.emit("game_action", { action: "wrong_route", train: this.resolved, target_lane: train.targetLane, routed_lane: routedLane, lives: this.lives });
        bridge.setStatus(`Wrong route — needed ${LANE_LABELS[train.targetLane]}, sent ${LANE_LABELS[routedLane]} · ${this.lives} lives`);
        tone(155, 0.14, 0.05);
      }
      if (this.lives <= 0) this.endRun();
    }

    private setLane(lane: SwitchLane, input: "keyboard" | "pointer") {
      if (this.mode === "gameover") { this.resetRun(); return; }
      if (lane === this.selectedLane) return;
      this.selectedLane = lane;
      this.switchLabel?.setText(`Switch ${LANE_LABELS[lane]}`).setColor(`#${LANE_COLORS[lane].toString(16).padStart(6, "0")}`);
      this.drawTracks();
      bridge.emit("game_action", { action: "switch_lane", lane, input, score: this.score });
      bridge.setStatus(`Switch set — ${lane.toUpperCase()} lane (${LANE_LABELS[lane]}) · ${this.lives} lives`);
      tone(330 + laneIndex(lane) * 90, 0.045, 0.02);
    }

    private laneX(lane: SwitchLane) {
      const ratios: Record<SwitchLane, number> = { left: 0.22, center: 0.5, right: 0.78 };
      return this.scale.width * ratios[lane];
    }

    private drawTracks() {
      const graphics = this.tracks;
      if (!graphics) return;
      const width = this.scale.width;
      const height = this.scale.height;
      const junction = { x: width / 2, y: height * 0.58 };
      graphics.clear();
      graphics.lineStyle(5, TRACK, 0.65);
      graphics.beginPath();
      graphics.moveTo(width / 2, height);
      graphics.lineTo(junction.x, junction.y);
      graphics.strokePath();
      for (const lane of ["left", "center", "right"] as const) {
        graphics.lineStyle(lane === this.selectedLane ? 8 : 4, lane === this.selectedLane ? ACTIVE_TRACK : TRACK, lane === this.selectedLane ? 0.9 : 0.5);
        graphics.beginPath();
        graphics.moveTo(junction.x, junction.y);
        graphics.lineTo(this.laneX(lane), 104);
        graphics.strokePath();
        graphics.fillStyle(LANE_COLORS[lane], 0.95);
        graphics.fillCircle(this.laneX(lane), 91, lane === this.selectedLane ? 16 : 12);
      }
    }

    private endRun() {
      if (this.mode === "gameover") return;
      this.mode = "gameover";
      bestScore = Math.max(bestScore, this.score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      this.bestLabel?.setText(`Best ${bestScore}`);
      bridge.emit("game_over", { score: this.score, trains: this.resolved, best_score: bestScore });
      bridge.setStatus(`Yard closed — ${this.score} points · ${this.resolved} trains · tap a lane or press R to retry`);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 26, "YARD CLOSED", { color: "#f5f7fa", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, `${this.score} points · ${this.resolved} trains\nTap / R to restart`, { color: "#9aa5b4", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5);
      tone(120, 0.22, 0.055);
    }

    private resetRun() {
      for (const train of this.trains) { train.body.destroy(); train.label.destroy(); }
      this.trains = [];
      this.mode = "playing";
      this.selectedLane = "center";
      this.resolved = 0;
      this.score = 0;
      this.streak = 0;
      this.lives = 3;
      this.seed = 48271;
      this.spawnElapsed = 1050;
      this.gameOverTitle?.destroy();
      this.gameOverDetail?.destroy();
      this.gameOverTitle = undefined;
      this.gameOverDetail = undefined;
      this.scoreLabel?.setText("Score 0");
      this.livesLabel?.setText("Lives ● ● ●");
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.switchLabel?.setText("Switch 2").setColor("#ffd36e");
      this.drawTracks();
      bridge.setStatus("Switchyard live — route each numbered train to the matching exit");
      bridge.emit("game_started", { mode: "endless", best_score: bestScore });
    }

    private handleResize() {
      this.bestLabel?.setPosition(this.scale.width - 24, 20);
      this.switchLabel?.setPosition(this.scale.width / 2, 22);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 26);
      this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 26);
      this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 20);
      this.drawTracks();
      for (const train of this.trains) this.positionTrain(train);
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [SwitchyardScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("switchyard"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("switchyard"); bridge.setStatus("Switchyard resumed"); },
    restart() { game.scene.stop("switchyard"); game.scene.start("switchyard"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
