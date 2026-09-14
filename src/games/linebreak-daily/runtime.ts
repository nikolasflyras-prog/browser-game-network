import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  cellKey,
  initialRouteState,
  puzzleForDateKey,
  routeSegments,
  sameCell,
  tryMove,
  utcDateKey,
  type Cell,
  type RouteState,
} from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x101114;
const GRID = 0x3c3d42;
const PAPER = 0xf5f3ed;
const MUTED = 0xaaa69c;
const ACCENT = 0xd93a2f;
const PATH = 0xf1c75b;
const KEY = 0xf1c75b;

type DailyResult = {
  puzzleId: string;
  segments: number;
  completedAt: string;
};

type BoardLayout = {
  cellSize: number;
  originX: number;
  originY: number;
};

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  const dateKey = utcDateKey();
  const puzzle = puzzleForDateKey(dateKey);
  const storageName = `daily-${dateKey}`;
  let savedResult = readLocalGameValue<DailyResult>(bridge.gameSlug, storageName, SAVE_VERSION);
  let muted = false;
  let audioContext: AudioContext | null = null;

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
      // Audio is optional; puzzle interaction must continue when Web Audio is unavailable.
    }
  };

  class LinebreakScene extends Phaser.Scene {
    private route: RouteState = initialRouteState(puzzle);
    private dragging = false;
    private board?: Phaser.GameObjects.Graphics;
    private routeGraphics?: Phaser.GameObjects.Graphics;
    private labels: Phaser.GameObjects.Text[] = [];
    private dateLabel?: Phaser.GameObjects.Text;
    private inkLabel?: Phaser.GameObjects.Text;
    private instruction?: Phaser.GameObjects.Text;
    private completionTitle?: Phaser.GameObjects.Text;
    private completionDetail?: Phaser.GameObjects.Text;
    private layout: BoardLayout = { cellSize: 60, originX: 0, originY: 0 };

    constructor() {
      super("linebreak-daily");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.board = this.add.graphics();
      this.routeGraphics = this.add.graphics();
      this.dateLabel = this.add.text(22, 18, `DAILY · ${dateKey}`, {
        color: "#aaa69c",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      });
      this.inkLabel = this.add.text(this.scale.width - 22, 18, "", {
        color: "#f5f3ed",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
      }).setOrigin(1, 0);
      this.instruction = this.add.text(this.scale.width / 2, this.scale.height - 24, "DRAG OR TAP · BACKTRACK ONE CELL TO UNDO", {
        color: "#aaa69c",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        align: "center",
      }).setOrigin(0.5, 1);

      this.input.on("pointerdown", this.handlePointerDown, this);
      this.input.on("pointermove", this.handlePointerMove, this);
      this.input.on("pointerup", () => { this.dragging = false; });
      this.input.on("pointerupoutside", () => { this.dragging = false; });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", this.handleResize, this);
      });

      this.resetRoute();
      bridge.emit("daily_started", {
        date_key: dateKey,
        puzzle_id: puzzle.id,
        previous_completion: Boolean(savedResult),
      });
    }

    private resetRoute() {
      this.route = initialRouteState(puzzle);
      this.dragging = false;
      this.completionTitle?.destroy();
      this.completionDetail?.destroy();
      this.completionTitle = undefined;
      this.completionDetail = undefined;
      this.computeLayout();
      this.renderBoard();
      this.updateStatus();
    }

    private computeLayout() {
      const horizontal = Math.max(240, this.scale.width - 72);
      const vertical = Math.max(240, this.scale.height - 150);
      const cellSize = Math.max(40, Math.min(82, horizontal / puzzle.width, vertical / puzzle.height));
      const boardWidth = cellSize * puzzle.width;
      const boardHeight = cellSize * puzzle.height;
      this.layout = {
        cellSize,
        originX: (this.scale.width - boardWidth) / 2,
        originY: Math.max(58, (this.scale.height - boardHeight) / 2),
      };
    }

    private handleResize() {
      this.computeLayout();
      this.dateLabel?.setPosition(22, 18);
      this.inkLabel?.setPosition(this.scale.width - 22, 18);
      this.instruction?.setPosition(this.scale.width / 2, this.scale.height - 24);
      this.positionCompletionCopy();
      this.renderBoard();
    }

    private cellFromPointer(pointer: Phaser.Input.Pointer): Cell | null {
      const { cellSize, originX, originY } = this.layout;
      const x = Math.floor((pointer.x - originX) / cellSize);
      const y = Math.floor((pointer.y - originY) / cellSize);
      if (x < 0 || y < 0 || x >= puzzle.width || y >= puzzle.height) return null;
      return { x, y };
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
      if (this.route.completed) return;
      const target = this.cellFromPointer(pointer);
      if (!target) return;
      const current = this.route.path[this.route.path.length - 1];

      if (sameCell(target, current)) {
        this.dragging = true;
        return;
      }

      if (this.applyTarget(target)) this.dragging = true;
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
      if (!this.dragging || !pointer.isDown || this.route.completed) return;
      const target = this.cellFromPointer(pointer);
      if (!target) return;
      const current = this.route.path[this.route.path.length - 1];
      if (sameCell(target, current)) return;
      this.applyTarget(target);
    }

    private applyTarget(target: Cell): boolean {
      const result = tryMove(this.route, target, puzzle);
      if (!result.accepted) {
        const messages = {
          "out-of-bounds": "Stay on the board",
          "non-adjacent": "Connect one neighboring cell at a time",
          hazard: "Blocked cell — route around it",
          "locked-gate": "Find the key before crossing the gate",
          revisit: "No loops — backtrack one cell to undo",
          "ink-limit": "Ink limit reached — backtrack to revise",
          completed: "Daily puzzle already complete",
        } as const;
        bridge.setStatus(messages[result.reason]);
        tone(145, 0.05, 0.018);
        return false;
      }

      this.route = result.state;
      tone(result.action === "backtrack" ? 260 : 390, 0.035, 0.018);
      this.renderBoard();

      if (this.route.completed) {
        this.completePuzzle();
      } else {
        this.updateStatus();
      }
      return true;
    }

    private completePuzzle() {
      const segments = routeSegments(this.route);
      const shouldWrite = !savedResult || segments < savedResult.segments;
      if (shouldWrite) {
        savedResult = {
          puzzleId: puzzle.id,
          segments,
          completedAt: new Date().toISOString(),
        };
        writeLocalGameValue(bridge.gameSlug, storageName, SAVE_VERSION, savedResult);
      }

      bridge.setStatus(`Daily complete — ${segments} ink · ${puzzle.inkLimit - segments} spare`);
      bridge.emit("daily_completed", {
        date_key: dateKey,
        puzzle_id: puzzle.id,
        segments,
        ink_limit: puzzle.inkLimit,
        personal_best: savedResult?.segments ?? segments,
      });
      bridge.emit("game_completed", {
        mode: "daily",
        score: Math.max(0, puzzle.inkLimit - segments),
        date_key: dateKey,
      });
      tone(660, 0.16, 0.045);

      this.completionTitle?.destroy();
      this.completionDetail?.destroy();
      this.completionTitle = this.add.text(0, 0, "LINE COMPLETE", {
        color: "#fffdf8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.completionDetail = this.add.text(0, 0, `${segments} ink used · ${puzzle.inkLimit - segments} spare\nRestart to solve it again`, {
        color: "#aaa69c",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        align: "center",
        lineSpacing: 6,
      }).setOrigin(0.5);
      this.positionCompletionCopy();
    }

    private positionCompletionCopy() {
      if (!this.completionTitle || !this.completionDetail) return;
      const { cellSize, originX, originY } = this.layout;
      const boardWidth = cellSize * puzzle.width;
      const boardHeight = cellSize * puzzle.height;
      const x = originX + boardWidth / 2;
      const y = originY + boardHeight / 2;
      this.completionTitle.setPosition(x, y - 22);
      this.completionDetail.setPosition(x, y + 19);
    }

    private updateStatus() {
      const segments = routeSegments(this.route);
      const objective = this.route.hasKey
        ? this.route.passedGate ? "Reach the exit" : "Key found — cross the gate"
        : "Find the key, then cross the gate";
      const prior = savedResult ? ` · Best ${savedResult.segments}` : "";
      bridge.setStatus(`${objective} · Ink ${segments}/${puzzle.inkLimit}${prior}`);
    }

    private renderBoard() {
      const board = this.board;
      const routeGraphics = this.routeGraphics;
      if (!board || !routeGraphics) return;
      board.clear();
      routeGraphics.clear();
      this.labels.forEach((label) => label.destroy());
      this.labels = [];

      const { cellSize, originX, originY } = this.layout;
      const hazardKeys = new Set(puzzle.hazards.map(cellKey));

      for (let y = 0; y < puzzle.height; y += 1) {
        for (let x = 0; x < puzzle.width; x += 1) {
          const left = originX + x * cellSize;
          const top = originY + y * cellSize;
          const centerX = left + cellSize / 2;
          const centerY = top + cellSize / 2;
          const value = { x, y };
          const key = cellKey(value);

          board.lineStyle(1, GRID, 1);
          board.strokeRect(left, top, cellSize, cellSize);

          if (hazardKeys.has(key)) {
            board.fillStyle(ACCENT, 0.16);
            board.fillRect(left + 4, top + 4, cellSize - 8, cellSize - 8);
            this.addCellLabel("×", centerX, centerY, "#d93a2f", Math.max(20, cellSize * 0.34));
          } else if (sameCell(value, puzzle.start)) {
            board.fillStyle(PAPER, 1);
            board.fillCircle(centerX, centerY, Math.max(12, cellSize * 0.16));
            this.addCellLabel("S", centerX, centerY, "#171717", Math.max(10, cellSize * 0.15));
          } else if (sameCell(value, puzzle.exit)) {
            board.lineStyle(3, PAPER, 0.95);
            board.strokeCircle(centerX, centerY, Math.max(14, cellSize * 0.2));
            this.addCellLabel("E", centerX, centerY, "#f5f3ed", Math.max(12, cellSize * 0.16));
          } else if (sameCell(value, puzzle.key)) {
            board.fillStyle(KEY, 1);
            board.fillCircle(centerX, centerY, Math.max(11, cellSize * 0.15));
            this.addCellLabel("K", centerX, centerY, "#171717", Math.max(10, cellSize * 0.14));
          } else if (sameCell(value, puzzle.gate)) {
            board.lineStyle(3, ACCENT, 0.95);
            board.strokeRect(left + 9, top + 9, cellSize - 18, cellSize - 18);
            this.addCellLabel("G", centerX, centerY, "#d93a2f", Math.max(12, cellSize * 0.16));
          }
        }
      }

      if (this.route.path.length > 1) {
        routeGraphics.lineStyle(Math.max(5, cellSize * 0.09), PATH, 0.95);
        routeGraphics.beginPath();
        this.route.path.forEach((value, index) => {
          const x = originX + value.x * cellSize + cellSize / 2;
          const y = originY + value.y * cellSize + cellSize / 2;
          if (index === 0) routeGraphics.moveTo(x, y);
          else routeGraphics.lineTo(x, y);
        });
        routeGraphics.strokePath();
      }

      this.route.path.forEach((value, index) => {
        const x = originX + value.x * cellSize + cellSize / 2;
        const y = originY + value.y * cellSize + cellSize / 2;
        routeGraphics.fillStyle(index === this.route.path.length - 1 ? PAPER : PATH, 1);
        routeGraphics.fillCircle(x, y, Math.max(5, cellSize * 0.07));
      });

      const used = routeSegments(this.route);
      this.inkLabel?.setText(`INK ${used}/${puzzle.inkLimit}`);
    }

    private addCellLabel(text: string, x: number, y: number, color: string, size: number) {
      const label = this.add.text(x, y, text, {
        color,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.round(size)}px`,
        fontStyle: "bold",
      }).setOrigin(0.5);
      this.labels.push(label);
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [LinebreakScene],
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
      game.scene.pause("linebreak-daily");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("linebreak-daily");
      bridge.setStatus("Linebreak Daily resumed");
    },
    restart() {
      game.scene.stop("linebreak-daily");
      game.scene.start("linebreak-daily");
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
