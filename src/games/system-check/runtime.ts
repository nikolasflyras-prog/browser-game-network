import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";

const SAVE_VERSION = 1;

type DiagnosticState = {
  interactions: number;
  best: number;
};

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let state: DiagnosticState = {
    interactions: 0,
    best: readLocalGameValue<number>(bridge.gameSlug, "diagnostic-best", SAVE_VERSION) ?? 0,
  };

  class DiagnosticScene extends Phaser.Scene {
    private marker?: Phaser.GameObjects.Arc;
    private counter?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private hint?: Phaser.GameObjects.Text;

    constructor() {
      super("diagnostic");
    }

    create() {
      bridge.setStatus("Runtime ready — click/tap or press Space");
      bridge.emit("game_started", { mode: "diagnostic" });

      this.marker = this.add.circle(this.scale.width / 2, this.scale.height / 2, 24, 0xd93a2f);
      this.counter = this.add.text(28, 26, "Inputs: 0", {
        color: "#fffdf8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
      });
      this.bestLabel = this.add.text(28, 58, `Best local run: ${state.best}`, {
        color: "#a7a39a",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "15px",
      });
      this.hint = this.add.text(this.scale.width / 2, this.scale.height - 42, "POINTER / TOUCH / SPACE", {
        color: "#a7a39a",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      }).setOrigin(0.5);

      const trigger = (inputType: "pointer" | "keyboard") => this.registerInput(inputType);
      this.input.on("pointerdown", () => trigger("pointer"));
      this.input.keyboard?.on("keydown-SPACE", () => trigger("keyboard"));
      this.scale.on("resize", this.layout, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.layout, this);
      });
      this.layout({ width: this.scale.width, height: this.scale.height });
    }

    private registerInput(inputType: "pointer" | "keyboard") {
      if (!this.marker || !this.counter || !this.bestLabel) return;
      state.interactions += 1;
      state.best = Math.max(state.best, state.interactions);
      writeLocalGameValue(bridge.gameSlug, "diagnostic-best", SAVE_VERSION, state.best);

      const padding = 44;
      const x = Phaser.Math.Between(padding, Math.max(padding, this.scale.width - padding));
      const y = Phaser.Math.Between(padding + 50, Math.max(padding + 50, this.scale.height - padding - 30));
      this.tweens.add({ targets: this.marker, x, y, duration: 170, ease: "Quad.Out" });

      this.counter.setText(`Inputs: ${state.interactions}`);
      this.bestLabel.setText(`Best local run: ${state.best}`);
      bridge.setStatus(`Input ${state.interactions} received via ${inputType}`);
    }

    private layout(gameSize: { width: number; height: number }) {
      this.hint?.setPosition(gameSize.width / 2, gameSize.height - 42);
      if (state.interactions === 0) {
        this.marker?.setPosition(gameSize.width / 2, gameSize.height / 2);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: "#111111",
    transparent: false,
    scene: [DiagnosticScene],
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
      game.scene.pause("diagnostic");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("diagnostic");
      bridge.setStatus("Runtime ready — click/tap or press Space");
    },
    restart() {
      state = { interactions: 0, best: state.best };
      game.scene.stop("diagnostic");
      game.scene.start("diagnostic");
      bridge.setStatus("Restarted");
    },
    destroy() {
      game.destroy(true);
    },
  };
}
