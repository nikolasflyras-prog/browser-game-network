import Phaser from "phaser";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  chooseSwitchyardAction,
  createSwitchyardPrototype,
  switchyardPrototypeResult,
  switchyardPrototypeView,
  type SwitchyardPrototypeSession,
} from "./prototype";
import { switchyardLayout } from "./layout";
import type { Depot, SwitchId, SwitchyardAction } from "./simulation";

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

type ActionButton = {
  action: SwitchyardAction;
  box: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

type SwitchLabel = { id: SwitchId; text: Phaser.GameObjects.Text };
type DepotLabel = { depot: Depot; text: Phaser.GameObjects.Text };

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
    private buttons: ActionButton[] = [];
    private switchLabels: SwitchLabel[] = [];
    private depotLabels: DepotLabel[] = [];
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
      this.train = this.add.circle(0, 0, 9, PAPER).setVisible(false).setDepth(4);
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
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 8, "A / B / C OR SPACE TO HOLD", {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
      }).setOrigin(0.5, 1);

      this.createBoardLabels();
      this.createButtons();

      this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard?.on("keydown-A", () => this.handleAction("A", "keyboard"));
      this.input.keyboard?.on("keydown-B", () => this.handleAction("B", "keyboard"));
      this.input.keyboard?.on("keydown-C", () => this.handleAction("C", "keyboard"));
      this.input.keyboard?.on("keydown-SPACE", () => this.handleAction("HOLD", "keyboard"));
      this.input.keyboard?.on("keydown-R", () => this.restartPuzzle("keyboard"));
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.handleResize, this);
      });

      this.resetPuzzle();
      bridge.emit("daily_started", { daily_id: dateKey, seed: dailySeed });
    }

    private createBoardLabels() {
      const switchStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        color: "#0d1213",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      };
      this.switchLabels = (["A", "B", "C"] as const).map((id) => ({
        id,
        text: this.add.text(0, 0, id, switchStyle).setOrigin(0.5).setDepth(3),
      }));
      this.depotLabels = ([0, 1, 2, 3] as const).map((depot) => ({
        depot,
        text: this.add.text(0, 0, `D${depot}`, {
          color: "#0d1213",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
        }).setOrigin(0.5).setDepth(3),
      }));
    }

    private createButtons() {
      for (const existing of this.buttons) {
        existing.box.destroy();
        existing.text.destroy();
      }
      this.buttons = [];
      for (const action of ["A", "B", "C", "HOLD"] as const) {
        const box = this.add.rectangle(0, 0, 90, 44, 0x1a2328, 1)
          .setStrokeStyle(1, TRACK, 0.8)
          .setInteractive({ useHandCursor: true });
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
      const layout = switchyardLayout(this.scale.width, this.scale.height);
      for (const button of this.buttons) {
        const slot = layout.controls[button.action];
        button.box.setPosition(slot.x, slot.y).setSize(slot.width, slot.height).setDisplaySize(slot.width, slot.height);
        button.text.setPosition(slot.x, slot.y);
      }
    }

    private restartPuzzle(inputType: "pointer" | "keyboard" | "controller") {
      bridge.emit("game_restarted", { mode: "daily", daily_id: dateKey, input_type: inputType });
      this.resetPuzzle();
    }

    private handleAction(action: SwitchyardAction, inputType: "pointer" | "keyboard") {
      if (this.busy) return;
      if (this.session.state.complete) {
        this.restartPuzzle(inputType);
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
      bridge.emit("game_action", {
        action: "switchyard_route",
        turn: outcome.turn,
        switch_action: action,
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
      const layout = switchyardLayout(this.scale.width, this.scale.height);
      const branch = actual < 2 ? layout.left : layout.right;
      const depot = layout.depots[actual];
      const train = this.train;
      if (!train) return;

      train.setPosition(layout.start.x, layout.start.y).setFillStyle(correct ? TARGET : ERROR).setVisible(true);
      this.tweens.add({
        targets: train,
        x: layout.root.x,
        y: layout.root.y,
        duration: 180,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.tweens.add({
            targets: train,
            x: branch.x,
            y: branch.y,
            duration: 240,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.tweens.add({
                targets: train,
                x: depot.x,
                y: depot.y,
                duration: 240,
                ease: "Sine.easeInOut",
                onComplete: () => this.finishTrainAnimation(),
              });
            },
          });
        },
      });
    }

    private finishTrainAnimation() {
      this.train?.setVisible(false);
      this.busy = false;
      this.displayTarget = this.session.state.target;
      if (this.session.state.complete) this.completePuzzle();
      this.renderBoard();
    }

    private completePuzzle() {
      const result = switchyardPrototypeResult(this.session);
      if (!result) return;
      bridge.emit("daily_completed", {
        daily_id: dateKey,
        score: result.score,
        strikes: result.strikes,
        won: result.won,
        sequence: result.sequence.map((value) => (value ? "1" : "0")).join(""),
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
      }).setOrigin(0.5).setDepth(5);
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
      ).setOrigin(0.5).setDepth(5);
    }

    private resetPuzzle() {
      if (this.train) this.tweens.killTweensOf(this.train);
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
      if (this.busy && this.train) {
        this.tweens.killTweensOf(this.train);
        this.finishTrainAnimation();
      }
      this.dateLabel?.setPosition(18, 16);
      this.progressLabel?.setPosition(this.scale.width / 2, 16);
      this.scoreLabel?.setPosition(this.scale.width - 18, 16);
      this.targetLabel?.setPosition(this.scale.width / 2, 48);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 8);
      this.resultTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 20);
      this.resultDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 20);
      this.positionButtons();
      this.renderBoard();
    }

    private renderBoard() {
      const graphics = this.graphics;
      if (!graphics) return;
      const view = switchyardPrototypeView(this.session);
      const layout = switchyardLayout(this.scale.width, this.scale.height);
      graphics.clear();

      const drawTrack = (from: { x: number; y: number }, to: { x: number; y: number }, active: boolean) => {
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

      const switchPoints: Record<SwitchId, { x: number; y: number }> = {
        A: layout.root,
        B: layout.left,
        C: layout.right,
      };
      for (const label of this.switchLabels) {
        const point = switchPoints[label.id];
        const on = view.switches[label.id];
        graphics.fillStyle(on ? TRACK_ACTIVE : PAPER, 1);
        graphics.fillCircle(point.x, point.y, 12);
        label.text.setPosition(point.x, point.y).setVisible(true);
      }

      for (const label of this.depotLabels) {
        const point = layout.depots[label.depot];
        const isTarget = label.depot === this.displayTarget;
        graphics.fillStyle(isTarget ? TARGET : PAPER, isTarget ? 1 : 0.35);
        graphics.fillRoundedRect(point.x - 26, point.y - 15, 52, 30, 6);
        label.text.setPosition(point.x, point.y).setVisible(true);
      }

      this.progressLabel?.setText(view.complete ? "Complete" : `Train ${view.turn + 1} / ${view.maxTurns}`);
      this.scoreLabel?.setText(`${view.score} pts · ${view.strikes} strikes`);
      this.targetLabel?.setText(`Target depot ${this.displayTarget}`);
      this.instruction?.setText(layout.compact ? "TAP A / B / C / HOLD" : "A / B / C OR SPACE TO HOLD");

      for (const button of this.buttons) {
        button.box.setFillStyle(this.busy ? 0x111619 : 0x1a2328, 1);
        button.box.setStrokeStyle(1, button.action === "HOLD" ? MUTED : TRACK_ACTIVE, this.busy ? 0.25 : 0.72);
        button.text.setAlpha(this.busy ? 0.45 : 1);
      }
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
      bridge.emit("game_restarted", { mode: "daily", daily_id: dateKey, input_type: "controller" });
      game.scene.stop("future-switchyard-daily");
      game.scene.start("future-switchyard-daily");
    },
    destroy() {
      game.destroy(true);
    },
  };
}
