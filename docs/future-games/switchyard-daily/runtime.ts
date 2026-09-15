import Phaser from "phaser";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { switchyardDailyId, switchyardSeedFromDateKey, switchyardUtcDateKey } from "./daily";
import {
  chooseSwitchyardAction,
  createSwitchyardPrototype,
  switchyardPrototypeResult,
  switchyardPrototypeView,
  type SwitchyardPrototypeSession,
} from "./prototype";
import { switchyardLayout } from "./layout";
import { describeSwitchyardRoute, type Depot, type SwitchId, type SwitchyardAction } from "./simulation";

const BACKGROUND = 0x0d1213;
const TRACK = 0x67757d;
const TRACK_ACTIVE = 0xe8d46a;
const PAPER = 0xf5f5ef;
const MUTED = 0x97a4a8;
const TARGET = 0x78dfaa;
const ERROR = 0xed786f;

type ActionButton = {
  action: SwitchyardAction;
  box: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

type SwitchLabel = { id: SwitchId; text: Phaser.GameObjects.Text };
type DepotLabel = { depot: Depot; text: Phaser.GameObjects.Text };
type YardPoint = { x: number; y: number };

export function mountSwitchyardPrototype(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  const dateKey = switchyardUtcDateKey();
  const dailyId = switchyardDailyId(dateKey);
  const dailySeed = switchyardSeedFromDateKey(dateKey);

  class SwitchyardScene extends Phaser.Scene {
    private session: SwitchyardPrototypeSession = createSwitchyardPrototype(dailySeed, 10);
    private graphics?: Phaser.GameObjects.Graphics;
    private train?: Phaser.GameObjects.Arc;
    private dateLabel?: Phaser.GameObjects.Text;
    private progressLabel?: Phaser.GameObjects.Text;
    private scoreLabel?: Phaser.GameObjects.Text;
    private targetLabel?: Phaser.GameObjects.Text;
    private routeLabel?: Phaser.GameObjects.Text;
    private outcomeLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private buttons: ActionButton[] = [];
    private switchLabels: SwitchLabel[] = [];
    private depotLabels: DepotLabel[] = [];
    private resultTitle?: Phaser.GameObjects.Text;
    private resultDetail?: Phaser.GameObjects.Text;
    private busy = false;
    private reduceMotion = false;
    private displayTarget: Depot = this.session.state.target;

    constructor() {
      super("future-switchyard-daily");
    }

    create() {
      this.reduceMotion = typeof window !== "undefined"
        && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.train = this.add.circle(0, 0, 9, PAPER).setVisible(false).setDepth(4);
      this.dateLabel = this.add.text(18, 16, `DAILY · ${dailyId}`, {
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
      this.outcomeLabel = this.add.text(this.scale.width / 2, 0, "No train routed yet", {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      this.routeLabel = this.add.text(this.scale.width / 2, 0, "", {
        color: "#f5f5ef",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
      }).setOrigin(0.5, 0.5);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 8, "A / B / C OR SPACE TO HOLD", {
        color: "#97a4a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
      }).setOrigin(0.5, 1);

      this.createBoardLabels();
      this.createButtons();
      this.positionStatusLabels();

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
      bridge.emit("daily_started", { daily_id: dailyId, date_key: dateKey, seed: dailySeed });
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

    private positionStatusLabels() {
      const layout = switchyardLayout(this.scale.width, this.scale.height);
      const routeY = layout.compact ? this.scale.height - 160 : this.scale.height - 106;
      this.routeLabel?.setPosition(this.scale.width / 2, routeY);
      this.outcomeLabel?.setPosition(this.scale.width / 2, routeY - 26);
    }

    private restartPuzzle(inputType: "pointer" | "keyboard" | "controller") {
      bridge.emit("game_restarted", {
        mode: "daily",
        daily_id: dailyId,
        date_key: dateKey,
        input_type: inputType,
      });
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
      this.outcomeLabel
        ?.setText(outcome.correct ? `✓ ROUTED TO D${outcome.actual}` : `× REACHED D${outcome.actual} · TARGET D${outcome.target}`)
        .setColor(outcome.correct ? "#78dfaa" : "#ed786f");
      bridge.emit("game_action", {
        daily_id: dailyId,
        date_key: dateKey,
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

      train.setFillStyle(correct ? TARGET : ERROR).setVisible(true);
      if (this.reduceMotion) {
        train.setPosition(depot.x, depot.y);
        this.time.delayedCall(120, () => this.finishTrainAnimation());
        return;
      }

      train.setPosition(layout.start.x, layout.start.y);
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
      const correctRoutes = result.sequence.filter(Boolean).length;
      bridge.emit("daily_completed", {
        daily_id: dailyId,
        date_key: dateKey,
        score: result.score,
        strikes: result.strikes,
        won: result.won,
        correct_routes: correctRoutes,
        total_routes: result.sequence.length,
        sequence: result.sequence.map((value) => (value ? "1" : "0")).join(""),
      });
      bridge.emit("game_completed", {
        mode: "daily",
        daily_id: dailyId,
        date_key: dateKey,
        score: result.score,
        won: result.won,
      });
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
        `${dailyId} · ${correctRoutes}/${result.sequence.length} routes\n${result.score} points · ${result.strikes} strikes\nTap a control or press R to replay`,
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
      this.outcomeLabel?.setText("No train routed yet").setColor("#97a4a8");
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
      this.positionStatusLabels();
      this.renderBoard();
    }

    private drawDirectionMarker(graphics: Phaser.GameObjects.Graphics, from: YardPoint, to: YardPoint) {
      const x = from.x + (to.x - from.x) * 0.58;
      const y = from.y + (to.y - from.y) * 0.58;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const size = 7;
      const tipX = x + Math.cos(angle) * size;
      const tipY = y + Math.sin(angle) * size;
      const leftX = x + Math.cos(angle + 2.45) * size;
      const leftY = y + Math.sin(angle + 2.45) * size;
      const rightX = x + Math.cos(angle - 2.45) * size;
      const rightY = y + Math.sin(angle - 2.45) * size;
      graphics.fillStyle(PAPER, 0.95);
      graphics.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
    }

    private renderBoard() {
      const graphics = this.graphics;
      if (!graphics) return;
      const view = switchyardPrototypeView(this.session);
      const layout = switchyardLayout(this.scale.width, this.scale.height);
      graphics.clear();

      const drawTrack = (from: YardPoint, to: YardPoint, active: boolean) => {
        graphics.lineStyle(active ? 4 : 2, active ? TRACK_ACTIVE : TRACK, active ? 0.95 : 0.55);
        graphics.beginPath();
        graphics.moveTo(from.x, from.y);
        graphics.lineTo(to.x, to.y);
        graphics.strokePath();
        if (active) this.drawDirectionMarker(graphics, from, to);
      };

      drawTrack(layout.start, layout.root, true);
      drawTrack(layout.root, layout.left, !view.switches.A);
      drawTrack(layout.root, layout.right, view.switches.A);
      drawTrack(layout.left, layout.depots[0], !view.switches.B);
      drawTrack(layout.left, layout.depots[1], view.switches.B);
      drawTrack(layout.right, layout.depots[2], !view.switches.C);
      drawTrack(layout.right, layout.depots[3], view.switches.C);

      const switchPoints: Record<SwitchId, YardPoint> = {
        A: layout.root,
        B: layout.left,
        C: layout.right,
      };
      for (const label of this.switchLabels) {
        const point = switchPoints[label.id];
        const on = view.switches[label.id];
        graphics.fillStyle(on ? TRACK_ACTIVE : PAPER, on ? 1 : 0.45);
        graphics.fillCircle(point.x, point.y, 12);
        graphics.lineStyle(on ? 3 : 2, PAPER, 0.95);
        graphics.strokeCircle(point.x, point.y, on ? 15 : 12);
        label.text.setPosition(point.x, point.y).setVisible(true);
      }

      for (const label of this.depotLabels) {
        const point = layout.depots[label.depot];
        const isTarget = label.depot === this.displayTarget;
        graphics.fillStyle(isTarget ? TARGET : PAPER, isTarget ? 1 : 0.35);
        graphics.fillRoundedRect(point.x - 26, point.y - 15, 52, 30, 6);
        graphics.lineStyle(isTarget ? 3 : 1, PAPER, isTarget ? 1 : 0.35);
        graphics.strokeRoundedRect(point.x - 28, point.y - 17, 56, 34, 7);
        if (isTarget) {
          graphics.fillStyle(PAPER, 1);
          graphics.fillTriangle(point.x, point.y - 29, point.x - 7, point.y - 20, point.x + 7, point.y - 20);
        }
        label.text.setPosition(point.x, point.y).setVisible(true);
      }

      this.progressLabel?.setText(view.complete ? "Complete" : `Train ${view.turn + 1} / ${view.maxTurns}`);
      this.scoreLabel?.setText(`${view.score} pts · ${view.strikes} strikes`);
      this.targetLabel?.setText(`TARGET D${this.displayTarget}`);
      this.routeLabel?.setText(`SWITCHES · ${describeSwitchyardRoute(view.switches)}`);
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
      bridge.emit("game_restarted", {
        mode: "daily",
        daily_id: dailyId,
        date_key: dateKey,
        input_type: "controller",
      });
      game.scene.stop("future-switchyard-daily");
      game.scene.start("future-switchyard-daily");
    },
    destroy() {
      game.destroy(true);
    },
  };
}
