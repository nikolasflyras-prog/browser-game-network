import Phaser from "phaser";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  chooseSwitchyardAction,
  createSwitchyardPrototype,
  switchyardPrototypeResult,
  switchyardPrototypeView,
  type SwitchyardPrototypeSession,
} from "./prototype";
import type { Depot, SwitchyardAction } from "./simulation";

const BACKGROUND = 0x0d1213;
const TRACK = 0x67757d;
const TRACK_ACTIVE = 0xe8d46a;
const PAPER = 0xf5f5ef;
const MUTED = 0x97a4a8;
const TARGET = 0x78dfaa;
const ERROR = 0xed786f;

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function seedFromDateKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type Point = { x: number; y: number };

type YardLayout = {
  start: Point;
  root: Point;
  left: Point;
  right: Point;
  depots: Record<Depot, Point>;
  buttonY: number;
};

export function mountSwitchyardPrototype(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  const dateKey = utcDateKey();
  const dailySeed = seedFromDateKey(dateKey);

  class SwitchyardScene extends Phaser.Scene {
    private session: SwitchyardPrototypeSession = createSwitchyardPrototype(dailySeed, 10);
    private graphics?: Phaser.GameObjects.Graphics;
    private train?: Phaser.GameObjects.Arc;
    private dateLabel?: Phaser.GameObjects.Text;
    private progressLabel?: Phaser.GameObjects.Text;
    private scoreLabel?: Phaser.GameObjects.Text;
    private targetLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private buttons: Array<{ action: SwitchyardAction; box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];
    private resultTitle?: Phaser.GameObjects.Text;
    private resultDetail?: Phaser.GameObjects.Text;
    private busy = false;
    private displayTarget: Depot = this.session.state.target;

    constructor() {
      super("future-switchyard-daily");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.train = this.add.circle(0, 0, 9, PAPER).setVisible(false);
      this.dateLabel = this.add.text(18, 16, `DAILY · ${dateKey}`, {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      });
      this.progressLabel = this.add.text(this.scale.width / 2, 16, "Train 1 / 10", {
        color: "#f5f5ef",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      }).setOrigin(0.5, 0);
      this.scoreLabel = this.add.text(this.scale.width - 18, 16, "0 pts · 0 strikes", {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      }).setOrigin(1, 0);
      this.targetLabel = this.add.text(this.scale.width / 2, 48, "Target depot 0", {
        color: "#78dfaa",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
      }).setOrigin(0.5, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 12, "A / B / C OR SPACE TO HOLD", {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
      }).setOrigin(0.5, 1);

      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.on("keydown-A", () => this.handleAction("A", "keyboard"));
      this.input.keyboard?.on("keydown-B", () => this.handleAction("B", "keyboard"));
      this.input.keyboard?.on("keydown-C", () => this.handleAction("C", "keyboard"));
      this.input.keyboard?.on("keydown-SPACE", () => this.handleAction("HOLD", "keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.resetPuzzle());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.handleResize, this);
      });

      this.createButtons();
      this.resetPuzzle();
      bridge.emit("daily_started", { daily_id: dateKey, seed: dailySeed });
    }

    private layout(): YardLayout {
      const width = this.scale.width;
      const height = this.scale.height;
      const center = width / 2;
      const boardBottom = Math.max(280, height - 150);
      return {
        start: { x: center, y: 82 },
        root: { x: center, y: 135 },
        left: { x: center - Math.min(145, width * 0.22), y: 220 },
        right: { x: center + Math.min(145, width * 0.22), y: 220 },
        depots: {
          0: { x: width * 0.16, y: boardBottom },
          1: { x: width * 0.36, y: boardBottom },
          2: { x: width * 0.64, y: boardBottom },
          3: { x: width * 0.84, y: boardBottom },
        },
        buttonY: height - 72,
      };
    }

    private createButtons() {
      for (const existing of this.buttons) {
        existing.box.destroy();
        existing.text.destroy();
      }
      this.buttons = [];
      const actions: readonly SwitchyardAction[] = ["A", "B", "C", "HOLD"];
      for (const action of actions) {
        const box = this.add.rectangle(0, 0, 90, 44, 0x1a2328, 1).setStrokeStyle(1, TRACK, 0.8).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, action, {
          color: "#f5f5ef",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "13px",
          fontStyle: "bold",
        }).setOrigin(0.5);
        box.on("pointerdown", () => this.handleAction(action, "pointer"));
        this.buttons.push({ action, box, text });
      }
      this.positionButtons();
    }

    private positionButtons() {
      const { buttonY } = this.layout();
      const gap = Math.min(105, this.scale.width / 4.6);
      const startX = this.scale.width / 2 - gap * 1.5;
      this.buttons.forEach((button, index) => {
        const x = startX + gap * index;
        button.box.setPosition(x, buttonY);
        button.text.setPosition(x, buttonY);
      });
    }

    private handleAction(action: SwitchyardAction, inputType: "pointer" | "keyboard") {
      if (this.busy) return;
      if (this.session.state.complete) {
        this.resetPuzzle();
        return;
      }

      this.busy = true;
      const target = this.session.state.target;
      this.session = chooseSwitchyardAction(this.session, action);
      const outcome = this.session.state.history.at(-1);
      if (!outcome) {
        this.busy = false;
        return;
      }

      this.displayTarget = target;
      bridge.emit("level_completed", {
        turn: outcome.turn,
        action,
        input_type: inputType,
        target: outcome.target,
        actual: outcome.actual,
        correct: outcome.correct,
        strikes: this.session.state.strikes,
      });
      bridge.setStatus(outcome.correct ? `Correct — depot ${outcome.actual}` : `Miss — train reached depot ${outcome.actual}`);
      this.renderBoard();
      this.animateTrain(outcome.actual, outcome.correct);
    }

    private animateTrain(actual: Depot, correct: boolean) {
      const layout = this.layout();
      const branch = actual < 2 ? layout.left : layout.right;
      const depot = layout.depots[actual];
      const train = this.train;
      if (!train) return;

      train.setPosition(layout.start.x, layout.start.y).setFillStyle(correct ? TARGET : ERROR).setVisible(true);
      this.tweens.add({
        targets: train,
        x: layout.root.x,
        y: layout.root.y,
        duration: 220,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.tweens.add({
            targets: train,
            x: branch.x,
            y: branch.y,
            duration: 300,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.tweens.add({
                targets: train,
                x: depot.x,
                y: depot.y,
                duration: 300,
                ease: "Sine.easeInOut",
                onComplete: () => {
                  train.setVisible(false);
                  this.busy = false;
                  this.displayTarget = this.session.state.target;
                  if (this.session.state.complete) this.completePuzzle();
                  this.renderBoard();
                },
              });
            },
          });
        },
      });
    }

    private completePuzzle() {
      const result = switchyardPrototypeResult(this.session);
      if (!result) return;
      bridge.emit("daily_completed", {
        daily_id: dateKey,
        score: result.score,
        strikes: result.strikes,
        won: result.won,
      });
      bridge.emit("game_completed", { mode: "daily", score: result.score, won: result.won });
      bridge.setStatus(result.won ? `Daily complete — ${result.score} points` : `Three strikes — ${result.score} points`);

      this.resultTitle?.destroy();
      this.resultDetail?.destroy();
      this.resultTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, result.won ? "YARD CLEARED" : "SHIFT ENDED", {
        color: "#f5f5ef",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.resultDetail = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 20,
        `${result.score} points · ${result.strikes} strikes\nTap a control or press R to replay`,
        {
          color: "#97a4a8",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "14px",
          align: "center",
          lineSpacing: 5,
        },
      ).setOrigin(0.5);
    }

    private resetPuzzle() {
      this.session = createSwitchyardPrototype(dailySeed, 10);
      this.displayTarget = this.session.state.target;
      this.busy = false;
      this.train?.setVisible(false);
      this.resultTitle?.destroy();
      this.resultDetail?.destroy();
      this.resultTitle = undefined;
      this.resultDetail = undefined;
      bridge.setStatus("Read the switches, then route the train to its target depot");
      this.renderBoard();
    }

    private handleResize() {
      this.dateLabel?.setPosition(18, 16);
      this.progressLabel?.setPosition(this.scale.width / 2, 16);
      this.scoreLabel?.setPosition(this.scale.width - 18, 16);
      this.targetLabel?.setPosition(this.scale.width / 2, 48);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 12);
      this.resultTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 20);
      this.resultDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 20);
      this.positionButtons();
      this.renderBoard();
    }

    private renderBoard() {
      const graphics = this.graphics;
      if (!graphics) return;
      const view = switchyardPrototypeView(this.session);
      const layout = this.layout();
      graphics.clear();

      const drawTrack = (from: Point, to: Point, active: boolean) => {
        graphics.lineStyle(active ? 4 : 2, active ? TRACK_ACTIVE : TRACK, active ? 0.95 : 0.55);
        graphics.beginPath();
        graphics.moveTo(from.x, from.y);
        graphics.lineTo(to.x, to.y);
        graphics.strokePath();
      };

      drawTrack(layout.start, layout.root, true);
      drawTrack(layout.root, layout.left, !view.switches.A);
      drawTrack(layout.root, layout.right, view.switches.A);
      drawTrack(layout.left, layout.depots[0], !view.switches.B);
      drawTrack(layout.left, layout.depots[1], view.switches.B);
      drawTrack(layout.right, layout.depots[2], !view.switches.C);
      drawTrack(layout.right, layout.depots[3], view.switches.C);

      const switchPoints: Array<[Point, string, boolean]> = [
        [layout.root, "A", view.switches.A],
        [layout.left, "B", view.switches.B],
        [layout.right, "C", view.switches.C],
      ];
      for (const [point, label, on] of switchPoints) {
        graphics.fillStyle(on ? TRACK_ACTIVE : PAPER, 1);
        graphics.fillCircle(point.x, point.y, 9);
        this.drawCanvasLabel(graphics, point.x, point.y - 22, label);
      }

      for (const depot of [0, 1, 2, 3] as const) {
        const point = layout.depots[depot];
        graphics.fillStyle(depot === this.displayTarget ? TARGET : PAPER, depot === this.displayTarget ? 1 : 0.25);
        graphics.fillRoundedRect(point.x - 24, point.y - 14, 48, 28, 6);
      }

      this.progressLabel?.setText(view.complete ? "Complete" : `Train ${view.turn + 1} / ${view.maxTurns}`);
      this.scoreLabel?.setText(`${view.score} pts · ${view.strikes} strikes`);
      this.targetLabel?.setText(`Target depot ${this.displayTarget}`);
      this.targetLabel?.setColor("#78dfaa");
      for (const button of this.buttons) {
        button.box.setFillStyle(this.busy ? 0x111619 : 0x1a2328, 1);
        button.box.setStrokeStyle(1, button.action === "HOLD" ? MUTED : TRACK_ACTIVE, this.busy ? 0.25 : 0.72);
      }
    }

    private drawCanvasLabel(graphics: Phaser.GameObjects.Graphics, x: number, y: number, label: string) {
      // Small label backing keeps switch IDs readable without adding persistent UI panels.
      graphics.fillStyle(BACKGROUND, 0.9);
      graphics.fillRoundedRect(x - 10, y - 8, 20, 16, 4);
      void label;
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
    pause() {
      game.scene.pause("future-switchyard-daily");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("future-switchyard-daily");
      bridge.setStatus("Switchyard Daily resumed");
    },
    restart() {
      game.scene.stop("future-switchyard-daily");
      game.scene.start("future-switchyard-daily");
    },
    destroy() {
      game.destroy(true);
    },
  };
}
