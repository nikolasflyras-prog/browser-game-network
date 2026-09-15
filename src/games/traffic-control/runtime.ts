import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  advanceTrafficSession,
  createTrafficSession,
  trafficResult,
  trafficView,
  type TrafficSession,
} from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0b1116;
const ROAD = 0x202932;
const ROAD_EDGE = 0x45515d;
const PAPER = 0xf4f7f8;
const GREEN = 0x73e0a0;
const RED = 0xf06c69;
const AMBER = 0xf3c86a;
const CAR_NS = 0x7ce8ff;
const CAR_EW = 0xf4b86a;
const TICK_MS = 100;

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;
  let runSeed = 41;
  let runIndex = 0;

  const tone = (frequency: number, duration = 0.06, volume = 0.035) => {
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
      // Sound is an enhancement only; gameplay must continue if Web Audio is blocked.
    }
  };

  class TrafficControlScene extends Phaser.Scene {
    private session: TrafficSession = createTrafficSession(runSeed);
    private pendingSwitch = false;
    private accumulator = 0;
    private runStartedAt = 0;
    private firstActionSent = false;
    private criticalPressureSent = false;
    private graphics?: Phaser.GameObjects.Graphics;
    private scoreLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private comboLabel?: Phaser.GameObjects.Text;
    private pressureLabel?: Phaser.GameObjects.Text;
    private phaseLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private resultTitle?: Phaser.GameObjects.Text;
    private resultDetail?: Phaser.GameObjects.Text;

    constructor() {
      super("traffic-control");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.scoreLabel = this.add.text(20, 18, "Score 0", {
        color: "#f4f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "22px", fontStyle: "bold",
      });
      this.comboLabel = this.add.text(20, 48, "Combo 0", {
        color: "#7ce8ff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold",
      });
      this.bestLabel = this.add.text(20, 68, `Best ${bestScore}`, {
        color: "#93a2af", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold",
      });
      this.pressureLabel = this.add.text(this.scale.width - 20, 20, "Pressure clear", {
        color: "#93a2af", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold",
      }).setOrigin(1, 0);
      this.phaseLabel = this.add.text(this.scale.width / 2, 94, "N/S GO · E/W STOP", {
        color: "#f4f7f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        backgroundColor: "#11171c",
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 22, "TAP / CLICK / SPACE TO SWITCH", {
        color: "#93a2af", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold",
      }).setOrigin(0.5, 1);

      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.input.on("pointerdown", () => this.requestSwitch("pointer"));
      this.input.keyboard?.on("keydown-SPACE", () => this.requestSwitch("keyboard"));
      this.input.keyboard?.on("keydown-ENTER", () => this.requestSwitch("keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.playerRestart("keyboard"));
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.handleResize, this);
      });
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (this.session.state.complete) return;
      this.accumulator += Math.min(delta, 250);
      while (this.accumulator >= TICK_MS && !this.session.state.complete) {
        const action = this.pendingSwitch ? "switch" : "none";
        this.pendingSwitch = false;
        this.session = advanceTrafficSession(this.session, action);
        this.accumulator -= TICK_MS;
        const view = trafficView(this.session);
        if (!this.criticalPressureSent && view.pressureBand === "critical") {
          this.criticalPressureSent = true;
          bridge.emit("game_action", {
            action: "near_gridlock",
            tick: view.tick,
            ns_queue: view.nsQueue,
            ew_queue: view.ewQueue,
            pressure: Number(view.pressure.toFixed(3)),
          });
        }
        if (this.session.state.complete) this.endRun();
      }
      this.renderState();
    }

    private requestSwitch(inputType: "pointer" | "keyboard") {
      if (this.session.state.complete) {
        this.playerRestart(inputType);
        return;
      }
      if (this.pendingSwitch || this.session.state.phase === "ALL_RED") return;
      const view = trafficView(this.session);
      this.pendingSwitch = true;
      const firstActionMs = this.firstActionSent ? undefined : Math.max(0, Date.now() - this.runStartedAt);
      this.firstActionSent = true;
      bridge.emit("game_action", {
        action: "signal_switch",
        input_type: inputType,
        tick: view.tick,
        phase: view.phase,
        ns_queue: view.nsQueue,
        ew_queue: view.ewQueue,
        first_action_ms: firstActionMs,
      });
      bridge.setStatus("Signal change requested");
      tone(390, 0.05, 0.025);
    }

    private playerRestart(inputType: "pointer" | "keyboard") {
      bridge.emit("game_restarted", { session_run_index: runIndex + 1, input_type: inputType });
      this.resetRun();
    }

    private resetRun() {
      runIndex += 1;
      runSeed += 97;
      this.session = createTrafficSession(runSeed);
      this.pendingSwitch = false;
      this.accumulator = 0;
      this.runStartedAt = Date.now();
      this.firstActionSent = false;
      this.criticalPressureSent = false;
      this.resultTitle?.destroy();
      this.resultDetail?.destroy();
      this.resultTitle = undefined;
      this.resultDetail = undefined;
      bridge.emit("game_started", { seed: runSeed, session_run_index: runIndex, best_score: bestScore });
      bridge.setStatus("Keep both approaches moving — tap to switch the signal");
      this.renderState();
    }

    private endRun() {
      const result = trafficResult(this.session);
      if (!result) return;
      if (result.score > bestScore) {
        bestScore = result.score;
        writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      }
      bridge.emit("game_over", {
        reason: result.reason,
        score: result.score,
        ticks: result.ticks,
        duration_ms: result.ticks * TICK_MS,
        switches: result.switches,
        peak_pressure: Number(result.peakPressure.toFixed(3)),
        best_score: bestScore,
      });
      bridge.setStatus(`Gridlock — ${result.score} points · tap or press Space to restart`);
      tone(145, 0.22, 0.05);

      this.resultTitle?.destroy();
      this.resultDetail?.destroy();
      this.resultTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 26, "GRIDLOCK", {
        color: "#f4f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold",
      }).setOrigin(0.5);
      this.resultDetail = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 18,
        `${result.score} points · ${result.switches} switches · Best ${bestScore}\nTap / Space to run it again`,
        { color: "#93a2af", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", align: "center", lineSpacing: 6 },
      ).setOrigin(0.5);
      this.renderState();
    }

    private handleResize() {
      this.scoreLabel?.setPosition(20, 18);
      this.comboLabel?.setPosition(20, 48);
      this.bestLabel?.setPosition(20, 68);
      this.pressureLabel?.setPosition(this.scale.width - 20, 20);
      this.phaseLabel?.setPosition(this.scale.width / 2, 94);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 22);
      this.resultTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 26);
      this.resultDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 18);
      this.renderState();
    }

    private renderState() {
      const graphics = this.graphics;
      if (!graphics) return;
      const view = trafficView(this.session);
      const width = this.scale.width;
      const height = this.scale.height;
      const cx = width / 2;
      const cy = height / 2;
      const roadWidth = Math.max(90, Math.min(150, Math.min(width, height) * 0.28));

      graphics.clear();
      graphics.fillStyle(ROAD, 1);
      graphics.fillRect(cx - roadWidth / 2, 0, roadWidth, height);
      graphics.fillRect(0, cy - roadWidth / 2, width, roadWidth);
      graphics.lineStyle(2, ROAD_EDGE, 0.7);
      graphics.strokeRect(cx - roadWidth / 2, 0, roadWidth, height);
      graphics.strokeRect(0, cy - roadWidth / 2, width, roadWidth);
      graphics.lineStyle(2, PAPER, 0.23);
      graphics.beginPath();
      graphics.moveTo(cx, 0);
      graphics.lineTo(cx, cy - roadWidth / 2 - 8);
      graphics.moveTo(cx, cy + roadWidth / 2 + 8);
      graphics.lineTo(cx, height);
      graphics.moveTo(0, cy);
      graphics.lineTo(cx - roadWidth / 2 - 8, cy);
      graphics.moveTo(cx + roadWidth / 2 + 8, cy);
      graphics.lineTo(width, cy);
      graphics.strokePath();

      this.drawQueue(graphics, "NS", view.nsQueue, cx, cy, roadWidth);
      this.drawQueue(graphics, "EW", view.ewQueue, cx, cy, roadWidth);
      this.drawSignals(graphics, view.phase, cx, cy, roadWidth);
      this.drawPressure(graphics, view.pressure, width);

      this.scoreLabel?.setText(`Score ${view.score}`);
      this.comboLabel?.setText(`Combo ${view.combo}`);
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.pressureLabel?.setText(`Pressure ${view.pressureBand}`);
      this.pressureLabel?.setColor(view.pressureBand === "critical" ? "#f06c69" : view.pressureBand === "building" ? "#f3c86a" : "#93a2af");
      this.phaseLabel?.setText(view.phase === "NS" ? "N/S GO · E/W STOP" : view.phase === "EW" ? "E/W GO · N/S STOP" : "ALL RED · SWITCHING");
      this.phaseLabel?.setColor(view.phase === "ALL_RED" ? "#f3c86a" : "#f4f7f8");
      this.instruction?.setText(view.complete ? "TAP / SPACE TO RESTART" : view.switching ? "ALL RED · SWITCHING" : "TAP / CLICK / SPACE TO SWITCH");
    }

    private drawQueue(graphics: Phaser.GameObjects.Graphics, axis: "NS" | "EW", count: number, cx: number, cy: number, roadWidth: number) {
      const maxVisible = Math.min(count, 10);
      graphics.fillStyle(axis === "NS" ? CAR_NS : CAR_EW, 1);
      for (let index = 0; index < maxVisible; index += 1) {
        const offset = 16 + index * 21;
        if (axis === "NS") graphics.fillRoundedRect(cx - 18, cy - roadWidth / 2 - offset - 14, 36, 14, 3);
        else graphics.fillRoundedRect(cx - roadWidth / 2 - offset - 14, cy - 18, 14, 36, 3);
      }
    }

    private drawSignals(graphics: Phaser.GameObjects.Graphics, phase: "NS" | "EW" | "ALL_RED", cx: number, cy: number, roadWidth: number) {
      const nsX = cx + roadWidth / 2 + 13;
      const nsY = cy - roadWidth / 2 - 13;
      const ewX = cx - roadWidth / 2 - 13;
      const ewY = cy + roadWidth / 2 + 13;
      graphics.fillStyle(phase === "NS" ? GREEN : RED, 1);
      graphics.fillCircle(nsX, nsY, 7);
      graphics.fillStyle(phase === "EW" ? GREEN : RED, 1);
      graphics.fillCircle(ewX, ewY, 7);
      graphics.lineStyle(2, PAPER, 0.8);
      if (phase === "NS") graphics.strokeCircle(nsX, nsY, 11);
      if (phase === "EW") graphics.strokeCircle(ewX, ewY, 11);
      if (phase === "ALL_RED") {
        graphics.lineStyle(3, AMBER, 0.8);
        graphics.strokeCircle(cx, cy, roadWidth * 0.28);
      }
    }

    private drawPressure(graphics: Phaser.GameObjects.Graphics, value: number, width: number) {
      const x = width * 0.25;
      const barWidth = width * 0.5;
      graphics.fillStyle(PAPER, 0.08);
      graphics.fillRoundedRect(x, 78, barWidth, 7, 4);
      graphics.fillStyle(value >= 0.75 ? RED : value >= 0.4 ? AMBER : GREEN, 0.9);
      graphics.fillRoundedRect(x, 78, barWidth * Math.min(1, value), 7, 4);
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [TrafficControlScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() {
      game.scene.pause("traffic-control");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("traffic-control");
      bridge.setStatus("Traffic Control resumed");
    },
    restart() {
      game.scene.stop("traffic-control");
      game.scene.start("traffic-control");
    },
    setMuted(nextMuted) {
      muted = nextMuted;
    },
    destroy() {
      game.destroy(true);
      void audioContext?.close();
    },
  };
}
