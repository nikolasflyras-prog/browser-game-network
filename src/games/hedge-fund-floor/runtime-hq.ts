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

const SAVE_VERSION = 2;
const BG = 0x071014;
const HALL = 0x111c21;
const WALL = 0x304149;
const CARPET = 0x17262c;
const WOOD = 0x47382f;
const SCREEN = 0x081013;
const PLAYER = 0xf4f7f8;
const RESEARCH = 0x63cbe8;
const PORTFOLIO = 0x78d6a8;
const SHORT = 0xe37b8f;
const RISK = 0xb297e4;
const STAFF = 0xd9b860;
const LP = 0x8fa5ad;
const NEWS = 0xe0b95d;

type Point = { x: number; y: number };
type Room = { x: number; y: number; width: number; height: number; label: string; tint: number };

const rooms: readonly Room[] = [
  { x: 28, y: 205, width: 285, height: 270, label: "RESEARCH LIBRARY", tint: 0x102a34 },
  { x: 344, y: 25, width: 360, height: 145, label: "NEWS + MACRO", tint: 0x2a2414 },
  { x: 440, y: 205, width: 340, height: 360, label: "PORTFOLIO COMMITTEE", tint: 0x153127 },
  { x: 805, y: 205, width: 210, height: 315, label: "RISK ROOM", tint: 0x251f35 },
  { x: 1000, y: 455, width: 215, height: 260, label: "LP CONFERENCE", tint: 0x1d292d },
  { x: 225, y: 585, width: 620, height: 145, label: "TEAM + OPERATIONS", tint: 0x302a19 },
] as const;

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
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "hq-best", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.07, volume = 0.025) => {
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

  class HedgeFundHqScene extends Phaser.Scene {
    private state!: HedgeFundState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private graphics?: Phaser.GameObjects.Graphics;
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private news?: Phaser.GameObjects.Text;
    private ideaPanel?: Phaser.GameObjects.Text;
    private bookPanel?: Phaser.GameObjects.Text;
    private roomLabels: Phaser.GameObjects.Text[] = [];
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private statusElapsed = 0;
    private visualElapsed = 0;

    constructor() {
      super("hedge-fund-hq");
    }

    create() {
      this.cameras.main.setBackgroundColor(BG);
      this.graphics = this.add.graphics();

      this.hudLeft = this.add.text(14, 12, "", {
        color: "#f4f7f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        backgroundColor: "#071014e8",
        padding: { x: 8, y: 5 },
      }).setDepth(30);

      this.hudRight = this.add.text(this.scale.width - 14, 12, "", {
        color: "#f4f7f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        align: "right",
        backgroundColor: "#071014e8",
        padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30);

      this.news = this.add.text(this.scale.width / 2, 13, "", {
        color: "#f0cf72",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        backgroundColor: "#071014f0",
        padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 0).setDepth(31).setAlpha(0);

      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 12, "", {
        color: "#f4f7f8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        backgroundColor: "#071014f2",
        padding: { x: 9, y: 5 },
      }).setOrigin(0.5, 1).setDepth(31);

      this.ideaPanel = this.add.text(12, this.scale.height - 12, "", {
        color: "#c5d5da",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineSpacing: 3,
        wordWrap: { width: 320 },
        backgroundColor: "#09161bed",
        padding: { x: 9, y: 7 },
      }).setOrigin(0, 1).setDepth(31).setAlpha(0);

      this.bookPanel = this.add.text(this.scale.width - 12, this.scale.height - 12, "", {
        color: "#c5d5da",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineSpacing: 2,
        align: "right",
        backgroundColor: "#09161bed",
        padding: { x: 9, y: 7 },
      }).setOrigin(1, 1).setDepth(31);

      this.touchInteract = this.add.text(this.scale.width - 64, this.scale.height - 46, "INTERACT", {
        color: "#78d6a8",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(33);

      this.roomLabels = rooms.map((room) => this.add.text(0, 0, room.label, {
        color: "#80949b",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        letterSpacing: 0.6,
      }).setOrigin(0, 0).setDepth(14));

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
        const world = this.screenToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const d = Math.hypot(dx, dy);
        if (d > 20) {
          x = dx / d;
          y = dy / d;
        }
      }

      const result = advanceFund(this.state, { x, y }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();

      this.statusElapsed += delta;
      if (this.statusElapsed >= 700) {
        this.statusElapsed = 0;
        const stats = fundStats(this.state);
        bridge.setStatus(`HQ live · NAV ${money(stats.nav)} · P&L ${money(stats.pnl)} · gross ${(stats.grossExposure * 100).toFixed(0)}% · beta ${pct(stats.betaExposure)}`);
      }
    }

    private camera() {
      const mobile = this.scale.width < 650;
      const scale = mobile
        ? Math.max(0.72, Math.min(0.95, this.scale.width / 470))
        : Math.min((this.scale.width - 34) / FUND_WORLD.width, (this.scale.height - 82) / FUND_WORLD.height);
      return {
        mobile,
        scale,
        cameraX: mobile ? this.state.playerX : FUND_WORLD.width / 2,
        cameraY: mobile ? this.state.playerY : FUND_WORLD.height / 2,
        anchorX: this.scale.width / 2,
        anchorY: mobile ? this.scale.height * 0.53 : 46 + FUND_WORLD.height * scale / 2,
      };
    }

    private project(x: number, y: number): Point {
      const c = this.camera();
      return {
        x: c.anchorX + (x - c.cameraX) * c.scale,
        y: c.anchorY + (y - c.cameraY) * c.scale,
      };
    }

    private screenToWorld(x: number, y: number) {
      const c = this.camera();
      return {
        x: c.cameraX + (x - c.anchorX) / c.scale,
        y: c.cameraY + (y - c.anchorY) / c.scale,
      };
    }

    private drawRectWorld(x: number, y: number, width: number, height: number, fill: number, alpha = 1, stroke = WALL) {
      const p = this.project(x, y);
      const c = this.camera();
      this.graphics?.fillStyle(fill, alpha).fillRoundedRect(p.x, p.y, width * c.scale, height * c.scale, Math.max(3, 8 * c.scale));
      this.graphics?.lineStyle(Math.max(1, 2 * c.scale), stroke, 0.8).strokeRoundedRect(p.x, p.y, width * c.scale, height * c.scale, Math.max(3, 8 * c.scale));
    }

    private drawOffice() {
      const graphics = this.graphics;
      if (!graphics) return;
      const c = this.camera();
      const origin = this.project(0, 0);
      graphics.fillStyle(HALL, 1).fillRect(origin.x, origin.y, FUND_WORLD.width * c.scale, FUND_WORLD.height * c.scale);

      for (let x = 0; x <= FUND_WORLD.width; x += 40) {
        const a = this.project(x, 0);
        const b = this.project(x, FUND_WORLD.height);
        graphics.lineStyle(Math.max(0.5, 0.7 * c.scale), 0x1d2a2f, 0.28).lineBetween(a.x, a.y, b.x, b.y);
      }
      for (let y = 0; y <= FUND_WORLD.height; y += 40) {
        const a = this.project(0, y);
        const b = this.project(FUND_WORLD.width, y);
        graphics.lineStyle(Math.max(0.5, 0.7 * c.scale), 0x1d2a2f, 0.28).lineBetween(a.x, a.y, b.x, b.y);
      }

      rooms.forEach((room, index) => {
        this.drawRectWorld(room.x, room.y, room.width, room.height, room.tint, 0.94);
        const labelPoint = this.project(room.x + 12, room.y + 10);
        this.roomLabels[index]?.setPosition(labelPoint.x, labelPoint.y).setScale(Math.max(0.75, c.scale));
      });

      for (const obstacle of fundLayout.obstacles) {
        this.drawRectWorld(obstacle.x, obstacle.y, obstacle.width, obstacle.height, WOOD, 0.92, 0x725e50);
        const screen = this.project(obstacle.x + obstacle.width * 0.55, obstacle.y + obstacle.height * 0.42);
        graphics.fillStyle(SCREEN, 1).fillRoundedRect(screen.x - 9 * c.scale, screen.y - 6 * c.scale, 18 * c.scale, 12 * c.scale, 2);
        graphics.fillStyle(0x63cbe8, 0.55).fillRect(screen.x - 6 * c.scale, screen.y - 3 * c.scale, 12 * c.scale, 2 * c.scale);
      }

      const table = this.project(555, 315);
      graphics.fillStyle(0x4b3b31, 1).fillRoundedRect(table.x, table.y, 115 * c.scale, 135 * c.scale, 10 * c.scale);
      graphics.lineStyle(Math.max(1, 2 * c.scale), 0x806757, 0.8).strokeRoundedRect(table.x, table.y, 115 * c.scale, 135 * c.scale, 10 * c.scale);
    }

    private drawStation(x: number, y: number, label: string, color: number, width = 112, height = 46) {
      const p = this.project(x - width / 2, y - height / 2);
      const c = this.camera();
      this.graphics?.fillStyle(color, 0.16).fillRoundedRect(p.x, p.y, width * c.scale, height * c.scale, 5 * c.scale);
      this.graphics?.lineStyle(Math.max(1, 2 * c.scale), color, 0.78).strokeRoundedRect(p.x, p.y, width * c.scale, height * c.scale, 5 * c.scale);
      const textPoint = this.project(x, y);
      const size = Math.max(7, 9 * c.scale);
      this.add.text(textPoint.x, textPoint.y, label, {
        color: `#${color.toString(16).padStart(6, "0")}`,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${size}px`,
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(12).setName("hq-dynamic-label");
    }

    private drawPerson(x: number, y: number, color: number, small = false) {
      const graphics = this.graphics;
      if (!graphics) return;
      const p = this.project(x, y);
      const c = this.camera();
      const scale = c.scale * (small ? 0.82 : 1);
      const bob = Math.sin((this.visualElapsed + x * 1.7) / 210) * 1.1 * scale;
      graphics.fillStyle(0x020406, 0.45).fillEllipse(p.x + 2 * scale, p.y + 8 * scale, 17 * scale, 7 * scale);
      graphics.fillStyle(color, 1).fillCircle(p.x, p.y - 2 * scale + bob, 8 * scale);
      graphics.fillStyle(0xf0c6a0, 1).fillCircle(p.x, p.y - 12 * scale + bob, 5 * scale);
    }

    private drawMarketBoard() {
      const graphics = this.graphics;
      if (!graphics) return;
      const c = this.camera();
      const p = this.project(405, 75);
      graphics.fillStyle(SCREEN, 0.98).fillRoundedRect(p.x, p.y, 235 * c.scale, 62 * c.scale, 4);
      fundAssets.forEach((asset, index) => {
        const price = this.state.prices[asset.id];
        const move = price / asset.basePrice - 1;
        const row = Math.floor(index / 3);
        const column = index % 3;
        const x = p.x + (22 + column * 75) * c.scale;
        const y = p.y + (20 + row * 26) * c.scale;
        graphics.fillStyle(move >= 0 ? PORTFOLIO : SHORT, 0.9).fillCircle(x, y, 3 * c.scale);
        graphics.fillStyle(0xa2b3b8, 0.5).fillRect(x + 7 * c.scale, y - c.scale, Math.min(40, 15 + Math.abs(move) * 300) * c.scale, 2 * c.scale);
      });
    }

    private draw() {
      const graphics = this.graphics;
      if (!graphics) return;
      graphics.clear();
      this.children.getByName("hq-dynamic-label")?.destroy();
      for (;;) {
        const label = this.children.getByName("hq-dynamic-label");
        if (!label) break;
        label.destroy();
      }

      this.drawOffice();
      this.drawMarketBoard();

      this.drawStation(fundLayout.research.x, fundLayout.research.y, "START DOSSIER", RESEARCH, 125, 52);
      this.drawStation(fundLayout.news.x, fundLayout.news.y, "NEWS TERMINAL", NEWS, 120, 44);
      this.drawStation(fundLayout.tradePads[0].x, fundLayout.tradePads[0].y, "ADD LONG $5M", PORTFOLIO, 125, 44);
      this.drawStation(fundLayout.tradePads[1].x, fundLayout.tradePads[1].y, "ADD SHORT $5M", SHORT, 125, 44);
      this.drawStation(fundLayout.tradePads[2].x, fundLayout.tradePads[2].y, "REJECT THESIS", LP, 125, 44);
      this.drawStation(fundLayout.riskPads[0].x, fundLayout.riskPads[0].y, "NEUTRALIZE BETA", RISK, 132, 48);
      this.drawStation(fundLayout.riskPads[1].x, fundLayout.riskPads[1].y, "REMOVE HEDGE", RISK, 132, 48);
      this.drawStation(fundLayout.hirePads[0].x, fundLayout.hirePads[0].y, "HIRE ANALYST", STAFF, 125, 44);
      this.drawStation(fundLayout.hirePads[1].x, fundLayout.hirePads[1].y, "HIRE TRADER", STAFF, 125, 44);
      this.drawStation(fundLayout.hirePads[2].x, fundLayout.hirePads[2].y, "HIRE RISK", STAFF, 125, 44);
      this.drawStation(fundLayout.lp.x, fundLayout.lp.y, "UPDATE LPs", LP, 120, 48);

      for (let index = 0; index < this.state.staff.analyst; index += 1) this.drawPerson(245 + index * 42, 365, RESEARCH, true);
      for (let index = 0; index < this.state.staff.trader; index += 1) this.drawPerson(505 + index * 42, 615, PORTFOLIO, true);
      for (let index = 0; index < this.state.staff.risk; index += 1) this.drawPerson(885 + index * 42, 445, RISK, true);
      this.drawPerson(this.state.playerX, this.state.playerY, PLAYER);

      const active = fundAssetById(this.state.activeIdeaId);
      if (active) {
        const p = this.project(this.state.playerX + 15, this.state.playerY - 20);
        graphics.fillStyle(RESEARCH, 1).fillRoundedRect(p.x, p.y, 18 * this.camera().scale, 12 * this.camera().scale, 2);
      }

      const stats = fundStats(this.state);
      this.hudLeft?.setText([
        `NAV ${money(stats.nav)}   P&L ${money(stats.pnl)}`,
        `Gross ${(stats.grossExposure * 100).toFixed(0)}%   Net ${pct(stats.netExposure)}   Beta ${pct(stats.betaExposure)}`,
      ]);
      this.hudRight?.setText([
        `${Math.ceil(this.state.timeLeft)}s   LP ${Math.round(this.state.reputation)}`,
        `Ops ${money(this.state.operatingBudget)}   Team A/T/R ${this.state.staff.analyst}/${this.state.staff.trader}/${this.state.staff.risk}`,
      ]);
      this.prompt?.setText(fundPrompt(this.state));
      this.news?.setText(this.state.newsLabel ?? "").setAlpha(this.state.newsTimeLeft > 0 ? 1 : 0);

      const idea = fundAssetById(this.state.activeIdeaId);
      if (idea) {
        const signal = this.state.researchSignal === null
          ? `Dossier running · ${Math.ceil(this.state.researchTimer)}s`
          : `Signal ${this.state.researchSignal >= 0 ? "+" : ""}${this.state.researchSignal.toFixed(2)} · confidence ${(this.state.researchConfidence * 100).toFixed(0)}%`;
        this.ideaPanel?.setText([
          `ACTIVE THESIS · ${idea.ticker}`,
          signal,
          idea.thesis,
          `Bull: ${idea.bullCase}`,
          `Bear: ${idea.bearCase}`,
        ]).setAlpha(1);
      } else {
        this.ideaPanel?.setAlpha(0);
      }

      const positionLines = fundAssets.map((asset) => {
        const summary = positionSummary(this.state, asset.id as FundAssetId);
        if (!summary) return null;
        return `${asset.ticker} ${summary.direction} ${money(Math.abs(summary.value))} · ${money(summary.pnl)}`;
      }).filter(Boolean) as string[];
      this.bookPanel?.setText([
        "PORTFOLIO",
        ...(positionLines.length ? positionLines : ["No positions"]),
        this.state.hedgeActive ? `Index hedge ${money(stats.hedgeNotional)}` : "Index hedge off",
      ]);

      const mobile = this.camera().mobile;
      this.ideaPanel?.setVisible(!mobile);
      this.bookPanel?.setVisible(!mobile);
      this.touchInteract?.setVisible(mobile);

      mount.dataset.fundX = this.state.playerX.toFixed(1);
      mount.dataset.fundY = this.state.playerY.toFixed(1);
      mount.dataset.fundMode = this.state.mode;
      mount.dataset.fundPositions = String(this.state.positions.length);
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
      if (event === "research_started") tone(390);
      if (event === "research_complete") tone(680, 0.09, 0.03);
      if (event === "trade_long") tone(760, 0.09, 0.03);
      if (event === "trade_short") tone(280, 0.09, 0.03);
      if (event === "idea_passed") tone(210);
      if (event === "hedge_set" || event === "hedge_cleared") tone(520);
      if (event === "staff_hired") tone(840, 0.08, 0.03);
      if (event === "hire_blocked") tone(150);
      if (event === "news") tone(610);
      if (event === "risk_alert") tone(130, 0.05, 0.02);
      if (event === "game_over") tone(95, 0.2, 0.04);
      if (event === "complete") tone(930, 0.16, 0.03);

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
        writeLocalGameValue(bridge.gameSlug, "hq-best", bestScore, SAVE_VERSION);
      }
      this.endTitle?.destroy();
      this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height * 0.4, completed ? "FUND REVIEW" : "RISK LIMIT BREACHED", {
        color: completed ? "#78d6a8" : "#e37b8f",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        backgroundColor: "#071014f2",
        padding: { x: 15, y: 9 },
      }).setOrigin(0.5).setDepth(60);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height * 0.51, [
        `Score ${score} · NAV ${money(stats.nav)} · P&L ${money(stats.pnl)}`,
        `Max drawdown ${(this.state.maxDrawdown * 100).toFixed(1)}% · LP confidence ${Math.round(this.state.reputation)}`,
        "Press R or use Restart to run the fund again.",
      ], {
        color: "#d5e0e3",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        align: "center",
        lineSpacing: 5,
        backgroundColor: "#09161bf2",
        padding: { x: 13, y: 10 },
      }).setOrigin(0.5).setDepth(60);
      bridge.setStatus(`${completed ? "Fund review complete" : "Fund failed"} · score ${score} · P&L ${money(stats.pnl)} · max DD ${(this.state.maxDrawdown * 100).toFixed(1)}%`);
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
      bridge.setStatus(`Hedge Fund HQ · ${FUND_SESSION_SECONDS}s · research → portfolio → risk → team → LPs`);
      bridge.emit("hedge_fund_started", { starting_nav: this.state.initialNav });
      this.draw();
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
      this.hudRight?.setPosition(gameSize.width - 14, 12);
      this.news?.setPosition(gameSize.width / 2, 13);
      this.prompt?.setPosition(gameSize.width / 2, gameSize.height - 12);
      this.ideaPanel?.setPosition(12, gameSize.height - 12);
      this.bookPanel?.setPosition(gameSize.width - 12, gameSize.height - 12);
      this.touchInteract?.setPosition(gameSize.width - 64, gameSize.height - 46);
      if (this.endTitle) this.endTitle.setPosition(gameSize.width / 2, gameSize.height * 0.4);
      if (this.endDetail) this.endDetail.setPosition(gameSize.width / 2, gameSize.height * 0.51);
      this.draw();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BG,
    transparent: false,
    scene: [HedgeFundHqScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() {
      game.scene.pause("hedge-fund-hq");
      bridge.setStatus("Hedge Fund HQ paused");
    },
    resume() {
      game.scene.resume("hedge-fund-hq");
      bridge.setStatus("Hedge Fund HQ resumed");
    },
    restart() {
      game.scene.stop("hedge-fund-hq");
      game.scene.start("hedge-fund-hq");
    },
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
    },
    destroy() {
      delete mount.dataset.fundX;
      delete mount.dataset.fundY;
      delete mount.dataset.fundMode;
      delete mount.dataset.fundPositions;
      game.destroy(true);
      void audioContext?.close();
      audioContext = null;
    },
  } satisfies GameRuntimeController;
}
