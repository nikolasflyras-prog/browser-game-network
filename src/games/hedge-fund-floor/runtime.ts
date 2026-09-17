import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  FUND_SESSION_SECONDS,
  FUND_WORLD,
  advanceFund,
  createHedgeFundState,
  fundAssetById,
  fundAssets,
  fundLayout,
  fundPrompt,
  fundScore,
  fundStats,
  interactFund,
  positionSummary,
  type FundAssetId,
  type FundEvent,
  type HedgeFundState,
} from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x05080b;
const FLOOR = 0x0d171c;
const GRID = 0x1d3038;
const DESK_TOP = 0x30454e;
const DESK_SIDE = 0x17262c;
const PLAYER = 0xf7fafb;
const SHADOW = 0x010203;
const RESEARCH = 0x69d9ff;
const LONG = 0x65e6b4;
const SHORT = 0xff7185;
const RISK = 0xb794f6;
const STAFF = 0xffd166;
const LP = 0x91a7b0;

type Point = { x: number; y: number };
type WorldLabel = { text: Phaser.GameObjects.Text; x: number; y: number };

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(absolute >= 10_000_000 ? 1 : 2)}M`;
  return `${sign}$${Math.round(absolute / 1_000)}K`;
}

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.07, volume = 0.03) => {
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

  class HedgeFundFloorScene extends Phaser.Scene {
    private state!: HedgeFundState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private graphics?: Phaser.GameObjects.Graphics;
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private news?: Phaser.GameObjects.Text;
    private ideaPanel?: Phaser.GameObjects.Text;
    private portfolioPanel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private worldLabels: WorldLabel[] = [];
    private visualElapsed = 0;
    private statusElapsed = 0;

    constructor() {
      super("hedge-fund-floor");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();

      this.hudLeft = this.add.text(16, 13, "", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        backgroundColor: "#05080bd9",
        padding: { x: 8, y: 5 },
      }).setDepth(30);

      this.hudRight = this.add.text(this.scale.width - 16, 13, "", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        align: "right",
        backgroundColor: "#05080bd9",
        padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30);

      this.bestLabel = this.add.text(this.scale.width - 16, 50, `Best ${bestScore}`, {
        color: "#81969f",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
      }).setOrigin(1, 0).setDepth(30);

      this.news = this.add.text(this.scale.width / 2, 13, "", {
        color: "#ffd166",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        backgroundColor: "#05080be8",
        padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 0).setDepth(31).setAlpha(0);

      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 13, "", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        backgroundColor: "#05080bed",
        padding: { x: 9, y: 5 },
      }).setOrigin(0.5, 1).setDepth(31);

      this.ideaPanel = this.add.text(14, this.scale.height - 14, "", {
        color: "#bdd0d6",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        lineSpacing: 3,
        wordWrap: { width: 335 },
        backgroundColor: "#071014ed",
        padding: { x: 9, y: 7 },
      }).setOrigin(0, 1).setDepth(31).setAlpha(0);

      this.portfolioPanel = this.add.text(this.scale.width - 14, this.scale.height - 14, "", {
        color: "#bdd0d6",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineSpacing: 2,
        align: "right",
        backgroundColor: "#071014ed",
        padding: { x: 8, y: 7 },
      }).setOrigin(1, 1).setDepth(31).setAlpha(0.94);

      this.touchInteract = this.add.text(this.scale.width - 66, this.scale.height - 48, "INTERACT", {
        color: "#65e6b4",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(33);

      this.buildWorldLabels();

      if (this.input.keyboard) {
        this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      }
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());

      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 136 && pointer.y >= this.scale.height - 86) this.interact();
      });

      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (!this.state || this.state.mode !== "playing") return;
      this.visualElapsed += delta;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));

      const pointer = this.input.activePointer;
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 136 && pointer.y >= this.scale.height - 86)) {
        const world = this.pointerToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const d = Math.hypot(dx, dy);
        if (d > 24) {
          x = dx / d;
          y = dy / d;
        }
      }

      const result = advanceFund(this.state, { x, y }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();

      this.statusElapsed += delta;
      if (this.statusElapsed >= 700 && this.state.mode === "playing") {
        this.statusElapsed = 0;
        const stats = fundStats(this.state);
        bridge.setStatus(`Hedge fund live · ${Math.ceil(this.state.timeLeft)}s · NAV ${money(stats.nav)} · P&L ${money(stats.pnl)} · beta ${pct(stats.betaExposure)}`);
      }
    }

    private isMobileView() {
      return this.scale.width < 650;
    }

    private projection() {
      const mobile = this.isMobileView();
      const cameraX = mobile ? this.state.playerX : FUND_WORLD.width / 2;
      const cameraY = mobile ? this.state.playerY : FUND_WORLD.height / 2;
      const scale = mobile
        ? Math.max(0.59, Math.min(0.8, this.scale.width / 520))
        : Math.min((this.scale.width - 44) / 1000, (this.scale.height - 92) / 520);
      return {
        mobile,
        cameraX,
        cameraY,
        scale,
        anchorX: this.scale.width / 2,
        anchorY: mobile ? this.scale.height * 0.53 : 58 + FUND_WORLD.height * 0.33 * scale,
      };
    }

    private project(x: number, y: number): Point {
      const p = this.projection();
      const dx = x - p.cameraX;
      const dy = y - p.cameraY;
      return {
        x: p.anchorX + (dx * 0.72 + dy * 0.18) * p.scale,
        y: p.anchorY + dy * 0.68 * p.scale,
      };
    }

    private pointerToWorld(screenX: number, screenY: number) {
      const p = this.projection();
      const dy = ((screenY - p.anchorY) / p.scale) / 0.68;
      const dx = ((screenX - p.anchorX) / p.scale - dy * 0.18) / 0.72;
      return { x: p.cameraX + dx, y: p.cameraY + dy };
    }

    private polygon(points: Point[], fill: number, alpha = 1, stroke?: number) {
      const graphics = this.graphics;
      if (!graphics || points.length < 3) return;
      graphics.fillStyle(fill, alpha);
      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
      graphics.closePath();
      graphics.fillPath();
      if (stroke !== undefined) {
        graphics.lineStyle(1.2, stroke, 0.8);
        graphics.strokePath();
      }
    }

    private drawFloor() {
      const graphics = this.graphics;
      if (!graphics) return;
      const corners = [
        this.project(0, 0),
        this.project(FUND_WORLD.width, 0),
        this.project(FUND_WORLD.width, FUND_WORLD.height),
        this.project(0, FUND_WORLD.height),
      ];
      this.polygon(corners.map((point) => ({ x: point.x + 10, y: point.y + 14 })), SHADOW, 0.72);
      this.polygon(corners, FLOOR, 1, GRID);
      graphics.lineStyle(Math.max(0.75, this.projection().scale), GRID, 0.4);
      for (let x = 0; x <= FUND_WORLD.width; x += 100) {
        const a = this.project(x, 0);
        const b = this.project(x, FUND_WORLD.height);
        graphics.lineBetween(a.x, a.y, b.x, b.y);
      }
      for (let y = 0; y <= FUND_WORLD.height; y += 80) {
        const a = this.project(0, y);
        const b = this.project(FUND_WORLD.width, y);
        graphics.lineBetween(a.x, a.y, b.x, b.y);
      }
    }

    private drawDesk(x: number, y: number, width: number, height: number) {
      const p1 = this.project(x, y);
      const p2 = this.project(x + width, y);
      const p3 = this.project(x + width, y + height);
      const p4 = this.project(x, y + height);
      const depth = Math.max(5, 12 * this.projection().scale);
      const down = (point: Point) => ({ x: point.x, y: point.y + depth });
      this.polygon([down(p1), down(p2), down(p3), down(p4)], SHADOW, 0.52);
      this.polygon([p4, p3, down(p3), down(p4)], DESK_SIDE, 1);
      this.polygon([p2, p3, down(p3), down(p2)], 0x20343b, 1);
      this.polygon([p1, p2, p3, p4], DESK_TOP, 1, GRID);
      const monitor = this.project(x + width * 0.55, y + height * 0.35);
      const s = this.projection().scale;
      this.graphics?.fillStyle(0x05090b, 1).fillRoundedRect(monitor.x - 11 * s, monitor.y - 10 * s, 22 * s, 12 * s, 2);
      this.graphics?.fillStyle(0x63c7e8, 0.6).fillRect(monitor.x - 8 * s, monitor.y - 7 * s, 16 * s, 2 * s);
    }

    private drawPerson(x: number, y: number, color: number, small = false) {
      const graphics = this.graphics;
      if (!graphics) return;
      const p = this.project(x, y);
      const s = this.projection().scale * (small ? 0.82 : 1);
      const bob = Math.sin((this.visualElapsed + x * 2.1) / 190) * 1.05 * s;
      graphics.fillStyle(SHADOW, 0.5).fillEllipse(p.x + 2 * s, p.y + 12 * s, 23 * s, 8 * s);
      graphics.lineStyle(Math.max(1, 3 * s), color, 1);
      graphics.lineBetween(p.x - 4 * s, p.y + 2 * s + bob, p.x - 6 * s, p.y + 14 * s);
      graphics.lineBetween(p.x + 4 * s, p.y + 2 * s + bob, p.x + 6 * s, p.y + 14 * s);
      graphics.fillStyle(color, 1).fillRoundedRect(p.x - 8 * s, p.y - 12 * s + bob, 16 * s, 18 * s, 5 * s);
      graphics.fillStyle(0xf0c6a0, 1).fillCircle(p.x, p.y - 18 * s + bob, 6.5 * s);
    }

    private drawZone(x: number, y: number, color: number, radius = 38) {
      const p = this.project(x, y);
      const r = Math.max(18, radius * this.projection().scale);
      this.graphics?.fillStyle(color, 0.1).fillCircle(p.x, p.y, r);
      this.graphics?.lineStyle(Math.max(1.2, 2.3 * this.projection().scale), color, 0.74).strokeCircle(p.x, p.y, r);
    }

    private buildWorldLabels() {
      const specs = [
        { label: "RESEARCH", x: fundLayout.research.x, y: fundLayout.research.y - 60 },
        { label: "NEWS", x: fundLayout.news.x, y: fundLayout.news.y - 48 },
        { label: "LONG $5M", x: fundLayout.tradePads[0].x, y: fundLayout.tradePads[0].y - 50 },
        { label: "SHORT $5M", x: fundLayout.tradePads[1].x, y: fundLayout.tradePads[1].y - 50 },
        { label: "PASS", x: fundLayout.tradePads[2].x, y: fundLayout.tradePads[2].y - 50 },
        { label: "BETA HEDGE", x: fundLayout.riskPads[0].x, y: fundLayout.riskPads[0].y - 52 },
        { label: "CLEAR HEDGE", x: fundLayout.riskPads[1].x, y: fundLayout.riskPads[1].y - 52 },
        { label: "ANALYST", x: fundLayout.hirePads[0].x, y: fundLayout.hirePads[0].y - 48 },
        { label: "TRADER", x: fundLayout.hirePads[1].x, y: fundLayout.hirePads[1].y - 48 },
        { label: "RISK", x: fundLayout.hirePads[2].x, y: fundLayout.hirePads[2].y - 48 },
        { label: "LP ROOM", x: fundLayout.lp.x, y: fundLayout.lp.y - 58 },
      ];
      this.worldLabels = specs.map((spec) => ({
        x: spec.x,
        y: spec.y,
        text: this.add.text(0, 0, spec.label, {
          color: "#91a7b0",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
        }).setOrigin(0.5).setDepth(18),
      }));
    }

    private drawMarketBoard() {
      const graphics = this.graphics;
      if (!graphics) return;
      const origin = this.project(420, 115);
      const s = this.projection().scale;
      graphics.fillStyle(0x05090b, 0.92).fillRoundedRect(origin.x - 92 * s, origin.y - 40 * s, 184 * s, 64 * s, 4);
      fundAssets.forEach((asset, index) => {
        const price = this.state.prices[asset.id];
        const move = price / asset.basePrice - 1;
        const x = origin.x + ((index % 3) - 1) * 55 * s;
        const y = origin.y - 20 * s + Math.floor(index / 3) * 27 * s;
        graphics.fillStyle(move >= 0 ? LONG : SHORT, 0.9).fillCircle(x - 17 * s, y, 2.3 * s);
        graphics.fillStyle(0x9fb4bc, 0.45).fillRect(x - 10 * s, y - 1 * s, Math.min(28, 8 + Math.abs(move) * 240) * s, 2 * s);
      });
    }

    private draw() {
      const graphics = this.graphics;
      if (!graphics) return;
      graphics.clear();
      this.drawFloor();

      for (const obstacle of fundLayout.obstacles) this.drawDesk(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      this.drawMarketBoard();

      this.drawZone(fundLayout.research.x, fundLayout.research.y, RESEARCH, 45);
      this.drawZone(fundLayout.news.x, fundLayout.news.y, STAFF, 38);
      this.drawZone(fundLayout.tradePads[0].x, fundLayout.tradePads[0].y, LONG, 37);
      this.drawZone(fundLayout.tradePads[1].x, fundLayout.tradePads[1].y, SHORT, 37);
      this.drawZone(fundLayout.tradePads[2].x, fundLayout.tradePads[2].y, LP, 34);
      this.drawZone(fundLayout.riskPads[0].x, fundLayout.riskPads[0].y, RISK, 42);
      this.drawZone(fundLayout.riskPads[1].x, fundLayout.riskPads[1].y, RISK, 42);
      for (const pad of fundLayout.hirePads) this.drawZone(pad.x, pad.y, STAFF, 36);
      this.drawZone(fundLayout.lp.x, fundLayout.lp.y, LP, 48);

      const active = fundAssetById(this.state.activeIdeaId);
      if (active) {
        const p = this.project(this.state.playerX, this.state.playerY - 38);
        graphics.fillStyle(RESEARCH, 0.85).fillRoundedRect(p.x - 10, p.y - 5, 20, 10, 2);
      }

      for (let index = 0; index < this.state.staff.analyst; index += 1) this.drawPerson(235 + index * 42, 350, RESEARCH, true);
      for (let index = 0; index < this.state.staff.trader; index += 1) this.drawPerson(665 + index * 42, 545, LONG, true);
      for (let index = 0; index < this.state.staff.risk; index += 1) this.drawPerson(950 + index * 38, 420, RISK, true);
      this.drawPerson(this.state.playerX, this.state.playerY, PLAYER);

      for (const label of this.worldLabels) {
        const p = this.project(label.x, label.y);
        label.text.setPosition(p.x, p.y).setScale(Math.max(0.78, this.projection().scale));
      }

      const stats = fundStats(this.state);
      this.hudLeft?.setText([
        `NAV ${money(stats.nav)}   P&L ${money(stats.pnl)}`,
        `Gross ${(stats.grossExposure * 100).toFixed(0)}%   Net ${pct(stats.netExposure)}   Beta ${pct(stats.betaExposure)}`,
      ]);
      this.hudRight?.setText([
        `${Math.ceil(this.state.timeLeft)}s   REP ${Math.round(this.state.reputation)}`,
        `Ops ${money(this.state.operatingBudget)}   Staff ${this.state.staff.analyst}/${this.state.staff.trader}/${this.state.staff.risk}`,
      ]);
      this.bestLabel?.setText(`Best ${bestScore}`);
      this.prompt?.setText(fundPrompt(this.state));
      this.news?.setText(this.state.newsLabel ?? "").setAlpha(this.state.newsTimeLeft > 0 ? 1 : 0);

      const idea = fundAssetById(this.state.activeIdeaId);
      if (idea) {
        const signal = this.state.researchSignal === null
          ? `Researching… ${Math.ceil(this.state.researchTimer)}s`
          : `Signal ${this.state.researchSignal >= 0 ? "+" : ""}${this.state.researchSignal.toFixed(2)} · confidence ${(this.state.researchConfidence * 100).toFixed(0)}%`;
        this.ideaPanel?.setText([
          `${idea.ticker} · ${idea.name}`,
          signal,
          idea.thesis,
          `Bull: ${idea.bullCase}`,
          `Bear: ${idea.bearCase}`,
        ]).setAlpha(1);
      } else {
        this.ideaPanel?.setAlpha(0);
      }

      const positionLines = fundAssets
        .map((asset) => {
          const summary = positionSummary(this.state, asset.id as FundAssetId);
          if (!summary) return null;
          return `${asset.ticker} ${summary.direction} ${money(Math.abs(summary.value))} · ${money(summary.pnl)}`;
        })
        .filter(Boolean) as string[];
      const hedgeLine = this.state.hedgeActive ? `INDEX HEDGE ${money(stats.hedgeNotional)}` : "INDEX HEDGE OFF";
      this.portfolioPanel?.setText(["BOOK", ...(positionLines.length ? positionLines : ["No positions"]), hedgeLine]);

      if (this.isMobileView()) {
        this.ideaPanel?.setVisible(false);
        this.portfolioPanel?.setVisible(false);
        this.touchInteract?.setVisible(true);
      } else {
        this.ideaPanel?.setVisible(true);
        this.portfolioPanel?.setVisible(true);
        this.touchInteract?.setVisible(false);
      }
    }

    private interact() {
      if (!this.state || this.state.mode !== "playing") return;
      const result = interactFund(this.state);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
    }

    private handleEvent(event: FundEvent) {
      if (event === "none" || event === "collision") return;
      const stats = fundStats(this.state);
      if (event === "research_started") tone(410, 0.05, 0.025);
      if (event === "research_complete") tone(680, 0.08, 0.03);
      if (event === "trade_long") tone(760, 0.09, 0.035);
      if (event === "trade_short") tone(300, 0.09, 0.035);
      if (event === "idea_passed") tone(220, 0.05, 0.025);
      if (event === "hedge_set" || event === "hedge_cleared") tone(520, 0.06, 0.03);
      if (event === "staff_hired") tone(880, 0.08, 0.03);
      if (event === "hire_blocked") tone(160, 0.06, 0.025);
      if (event === "news") tone(620, 0.05, 0.024);
      if (event === "risk_alert") tone(145, 0.04, 0.02);
      if (event === "game_over") tone(100, 0.22, 0.04);
      if (event === "complete") tone(930, 0.18, 0.035);

      bridge.emit(`hedge_fund_${event}`, {
        nav: Math.round(stats.nav),
        pnl: Math.round(stats.pnl),
        gross_exposure: Number(stats.grossExposure.toFixed(3)),
        beta_exposure: Number(stats.betaExposure.toFixed(3)),
        reputation: Math.round(this.state.reputation),
        trades: this.state.trades,
      });

      if (event === "complete" || event === "game_over") this.finishRun(event === "complete");
    }

    private finishRun(completed: boolean) {
      const score = fundScore(this.state);
      const stats = fundStats(this.state);
      if (score > bestScore) {
        bestScore = score;
        writeLocalGameValue(bridge.gameSlug, "high-score", bestScore, SAVE_VERSION);
      }
      this.endTitle?.destroy();
      this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height * 0.38, completed ? "CLOSING BELL" : "FUND RISK LIMIT BREACHED", {
        color: completed ? "#65e6b4" : "#ff7185",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        backgroundColor: "#05080bf2",
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(60);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height * 0.5, [
        `Score ${score} · NAV ${money(stats.nav)} · P&L ${money(stats.pnl)}`,
        `Max drawdown ${(this.state.maxDrawdown * 100).toFixed(1)}% · Risk time ${this.state.riskBreaches.toFixed(1)}s`,
        "Press R or use Restart to run the fund again.",
      ], {
        color: "#d6e1e5",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        align: "center",
        lineSpacing: 5,
        backgroundColor: "#071014f2",
        padding: { x: 13, y: 10 },
      }).setOrigin(0.5).setDepth(60);
      bridge.setStatus(`${completed ? "Session complete" : "Fund failed"} · score ${score} · P&L ${money(stats.pnl)} · max DD ${(this.state.maxDrawdown * 100).toFixed(1)}%`);
    }

    private resetRun() {
      const seed = Math.floor((Date.now() / 137) % 0xffffffff);
      this.state = createHedgeFundState(seed);
      this.endTitle?.destroy();
      this.endDetail?.destroy();
      this.endTitle = undefined;
      this.endDetail = undefined;
      this.statusElapsed = 0;
      this.visualElapsed = 0;
      bridge.setStatus(`Hedge Fund Floor live · ${FUND_SESSION_SECONDS}s · move with WASD/arrows · E/Space interacts`);
      bridge.emit("hedge_fund_started", { starting_nav: this.state.initialNav });
      this.draw();
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
      this.hudRight?.setPosition(gameSize.width - 16, 13);
      this.bestLabel?.setPosition(gameSize.width - 16, 50);
      this.news?.setPosition(gameSize.width / 2, 13);
      this.prompt?.setPosition(gameSize.width / 2, gameSize.height - 13);
      this.ideaPanel?.setPosition(14, gameSize.height - 14);
      this.portfolioPanel?.setPosition(gameSize.width - 14, gameSize.height - 14);
      this.touchInteract?.setPosition(gameSize.width - 66, gameSize.height - 48);
      if (this.endTitle) this.endTitle.setPosition(gameSize.width / 2, gameSize.height * 0.38);
      if (this.endDetail) this.endDetail.setPosition(gameSize.width / 2, gameSize.height * 0.5);
      this.draw();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    width: Math.max(320, mount.clientWidth || 960),
    height: Math.max(470, Math.min(720, mount.clientHeight || 620)),
    backgroundColor: BACKGROUND,
    transparent: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    scene: HedgeFundFloorScene,
  });

  return {
    pause() {
      game.scene.pause("hedge-fund-floor");
      bridge.setStatus("Hedge Fund Floor paused");
    },
    resume() {
      game.scene.resume("hedge-fund-floor");
      bridge.setStatus("Hedge Fund Floor resumed");
    },
    restart() {
      const scene = game.scene.getScene("hedge-fund-floor") as HedgeFundFloorScene;
      scene.scene.restart();
    },
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
    },
    destroy() {
      audioContext?.close().catch(() => undefined);
      game.destroy(true);
    },
  };
}
