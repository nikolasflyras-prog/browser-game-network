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
import {
  applyMandatePressure,
  applyRegimeFrame,
  evaluateMandate,
  FUND_REGIMES,
  initializeRegimeState,
  regimeForRun,
  regimeScoreAdjustment,
  type FundRegime,
} from "./regimes";

const SAVE_VERSION = 3;
const BG = 0x071014;
const HALL = 0x111c21;
const WALL = 0x304149;
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
const DANGER = 0xed7d88;

type Point = { x: number; y: number };
type Room = { x: number; y: number; width: number; height: number; label: string; tint: number };
type Station = { x: number; y: number; label: string; color: number; width?: number; height?: number };

const rooms: readonly Room[] = [
  { x: 28, y: 205, width: 285, height: 270, label: "RESEARCH LIBRARY", tint: 0x102a34 },
  { x: 344, y: 25, width: 360, height: 145, label: "NEWS + MACRO", tint: 0x2a2414 },
  { x: 440, y: 205, width: 340, height: 360, label: "PORTFOLIO COMMITTEE", tint: 0x153127 },
  { x: 805, y: 205, width: 210, height: 315, label: "RISK ROOM", tint: 0x251f35 },
  { x: 1000, y: 455, width: 215, height: 260, label: "LP CONFERENCE", tint: 0x1d292d },
  { x: 225, y: 585, width: 620, height: 145, label: "TEAM + OPERATIONS", tint: 0x302a19 },
] as const;

const stations: readonly Station[] = [
  { x: fundLayout.research.x, y: fundLayout.research.y, label: "START DOSSIER", color: RESEARCH, width: 125, height: 52 },
  { x: fundLayout.news.x, y: fundLayout.news.y, label: "NEWS TERMINAL", color: NEWS, width: 120, height: 44 },
  { x: fundLayout.tradePads[0].x, y: fundLayout.tradePads[0].y, label: "ADD LONG $5M", color: PORTFOLIO, width: 125, height: 44 },
  { x: fundLayout.tradePads[1].x, y: fundLayout.tradePads[1].y, label: "ADD SHORT $5M", color: SHORT, width: 125, height: 44 },
  { x: fundLayout.tradePads[2].x, y: fundLayout.tradePads[2].y, label: "REJECT THESIS", color: LP, width: 125, height: 44 },
  { x: fundLayout.riskPads[0].x, y: fundLayout.riskPads[0].y, label: "NEUTRALIZE BETA", color: RISK, width: 132, height: 48 },
  { x: fundLayout.riskPads[1].x, y: fundLayout.riskPads[1].y, label: "REMOVE HEDGE", color: RISK, width: 132, height: 48 },
  { x: fundLayout.hirePads[0].x, y: fundLayout.hirePads[0].y, label: "HIRE ANALYST", color: STAFF, width: 125, height: 44 },
  { x: fundLayout.hirePads[1].x, y: fundLayout.hirePads[1].y, label: "HIRE TRADER", color: STAFF, width: 125, height: 44 },
  { x: fundLayout.hirePads[2].x, y: fundLayout.hirePads[2].y, label: "HIRE RISK", color: STAFF, width: 125, height: 44 },
  { x: fundLayout.lp.x, y: fundLayout.lp.y, label: "UPDATE LPs", color: LP, width: 120, height: 48 },
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
  let runNumber = readLocalGameValue<number>(bridge.gameSlug, "regime-run", SAVE_VERSION) ?? 0;

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

  class HedgeFundRegimeScene extends Phaser.Scene {
    private state!: HedgeFundState;
    private regime!: FundRegime;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private graphics?: Phaser.GameObjects.Graphics;
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private mandatePanel?: Phaser.GameObjects.Text;
    private news?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private ideaPanel?: Phaser.GameObjects.Text;
    private bookPanel?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private roomLabels: Phaser.GameObjects.Text[] = [];
    private stationLabels: Phaser.GameObjects.Text[] = [];
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private statusElapsed = 0;
    private visualElapsed = 0;

    constructor() {
      super("hedge-fund-regimes");
    }

    create() {
      this.cameras.main.setBackgroundColor(BG);
      this.graphics = this.add.graphics();
      this.hudLeft = this.add.text(14, 12, "", this.hudStyle(14)).setDepth(30);
      this.hudRight = this.add.text(this.scale.width - 14, 12, "", { ...this.hudStyle(13), align: "right" }).setOrigin(1, 0).setDepth(30);
      this.mandatePanel = this.add.text(this.scale.width / 2, 12, "", {
        color: "#d9e4e6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold", align: "center",
        backgroundColor: "#10191df2", padding: { x: 9, y: 5 }, wordWrap: { width: 520 },
      }).setOrigin(0.5, 0).setDepth(32);
      this.news = this.add.text(this.scale.width / 2, 70, "", {
        color: "#f0cf72", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold", align: "center",
        backgroundColor: "#071014f0", padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 0).setDepth(31).setAlpha(0);
      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 12, "", {
        color: "#f4f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold", align: "center",
        backgroundColor: "#071014f2", padding: { x: 9, y: 5 },
      }).setOrigin(0.5, 1).setDepth(31);
      this.ideaPanel = this.add.text(12, this.scale.height - 12, "", {
        color: "#c5d5da", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", lineSpacing: 3,
        wordWrap: { width: 320 }, backgroundColor: "#09161bed", padding: { x: 9, y: 7 },
      }).setOrigin(0, 1).setDepth(31).setAlpha(0);
      this.bookPanel = this.add.text(this.scale.width - 12, this.scale.height - 12, "", {
        color: "#c5d5da", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", lineSpacing: 2, align: "right",
        backgroundColor: "#09161bed", padding: { x: 9, y: 7 },
      }).setOrigin(1, 1).setDepth(31);
      this.touchInteract = this.add.text(this.scale.width - 64, this.scale.height - 46, "INTERACT", {
        color: "#78d6a8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(33);

      this.roomLabels = rooms.map((room) => this.add.text(0, 0, room.label, {
        color: "#80949b", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", fontStyle: "bold", letterSpacing: 0.6,
      }).setOrigin(0, 0).setDepth(14));
      this.stationLabels = stations.map((station) => this.add.text(0, 0, station.label, {
        color: `#${station.color.toString(16).padStart(6, "0")}`, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", fontStyle: "bold", align: "center",
      }).setOrigin(0.5).setDepth(16));

      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R,M") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun(false));
      this.input.keyboard?.on("keydown-M", () => this.resetRun(true));
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 136 && pointer.y >= this.scale.height - 86) this.interact();
      });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun(false);
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
        const distance = Math.hypot(dx, dy);
        if (distance > 20) { x = dx / distance; y = dy / distance; }
      }

      const dt = delta / 1000;
      const advanced = advanceFund(this.state, { x, y }, dt);
      let nextState = applyRegimeFrame(advanced.state, this.regime, dt);
      nextState = applyMandatePressure(nextState, this.regime, dt);
      const becameGameOver = this.state.mode === "playing" && nextState.mode === "gameover" && advanced.event !== "game_over";
      this.state = nextState;
      this.handleEvent(becameGameOver ? "game_over" : advanced.event);
      this.draw();

      this.statusElapsed += delta;
      if (this.statusElapsed >= 700) {
        this.statusElapsed = 0;
        const stats = fundStats(this.state);
        bridge.setStatus(`${this.regime.label} · NAV ${money(stats.nav)} · P&L ${money(stats.pnl)} · gross ${(stats.grossExposure * 100).toFixed(0)}% · beta ${pct(stats.betaExposure)}`);
      }
    }

    private hudStyle(size: number): Phaser.Types.GameObjects.Text.TextStyle {
      return { color: "#f4f7f8", fontFamily: "Arial, Helvetica, sans-serif", fontSize: `${size}px`, fontStyle: "bold", backgroundColor: "#071014e8", padding: { x: 8, y: 5 } };
    }

    private camera() {
      const mobile = this.scale.width < 650;
      const scale = mobile ? Math.max(0.72, Math.min(0.95, this.scale.width / 470)) : Math.min((this.scale.width - 34) / FUND_WORLD.width, (this.scale.height - 100) / FUND_WORLD.height);
      return { mobile, scale, cameraX: mobile ? this.state.playerX : FUND_WORLD.width / 2, cameraY: mobile ? this.state.playerY : FUND_WORLD.height / 2, anchorX: this.scale.width / 2, anchorY: mobile ? this.scale.height * 0.54 : 58 + FUND_WORLD.height * scale / 2 };
    }

    private project(x: number, y: number): Point {
      const c = this.camera();
      return { x: c.anchorX + (x - c.cameraX) * c.scale, y: c.anchorY + (y - c.cameraY) * c.scale };
    }

    private screenToWorld(x: number, y: number) {
      const c = this.camera();
      return { x: c.cameraX + (x - c.anchorX) / c.scale, y: c.cameraY + (y - c.anchorY) / c.scale };
    }

    private drawRectWorld(x: number, y: number, width: number, height: number, fill: number, alpha = 1, stroke = WALL) {
      const p = this.project(x, y); const c = this.camera();
      this.graphics?.fillStyle(fill, alpha).fillRoundedRect(p.x, p.y, width * c.scale, height * c.scale, Math.max(3, 8 * c.scale));
      this.graphics?.lineStyle(Math.max(1, 2 * c.scale), stroke, 0.8).strokeRoundedRect(p.x, p.y, width * c.scale, height * c.scale, Math.max(3, 8 * c.scale));
    }

    private draw() {
      const graphics = this.graphics; if (!graphics) return; graphics.clear();
      const c = this.camera(); const origin = this.project(0, 0);
      graphics.fillStyle(HALL, 1).fillRect(origin.x, origin.y, FUND_WORLD.width * c.scale, FUND_WORLD.height * c.scale);
      for (let x = 0; x <= FUND_WORLD.width; x += 40) { const a = this.project(x, 0); const b = this.project(x, FUND_WORLD.height); graphics.lineStyle(Math.max(0.5, 0.7 * c.scale), 0x1d2a2f, 0.28).lineBetween(a.x, a.y, b.x, b.y); }
      for (let y = 0; y <= FUND_WORLD.height; y += 40) { const a = this.project(0, y); const b = this.project(FUND_WORLD.width, y); graphics.lineStyle(Math.max(0.5, 0.7 * c.scale), 0x1d2a2f, 0.28).lineBetween(a.x, a.y, b.x, b.y); }

      rooms.forEach((room, index) => {
        this.drawRectWorld(room.x, room.y, room.width, room.height, room.tint, 0.94);
        const point = this.project(room.x + 12, room.y + 10);
        this.roomLabels[index]?.setPosition(point.x, point.y).setScale(Math.max(0.75, c.scale));
      });
      for (const obstacle of fundLayout.obstacles) {
        this.drawRectWorld(obstacle.x, obstacle.y, obstacle.width, obstacle.height, WOOD, 0.92, 0x725e50);
        const screen = this.project(obstacle.x + obstacle.width * 0.55, obstacle.y + obstacle.height * 0.42);
        graphics.fillStyle(SCREEN, 1).fillRoundedRect(screen.x - 9 * c.scale, screen.y - 6 * c.scale, 18 * c.scale, 12 * c.scale, 2);
      }
      stations.forEach((station, index) => {
        const width = station.width ?? 112; const height = station.height ?? 46; const p = this.project(station.x - width / 2, station.y - height / 2);
        graphics.fillStyle(station.color, 0.16).fillRoundedRect(p.x, p.y, width * c.scale, height * c.scale, 5 * c.scale);
        graphics.lineStyle(Math.max(1, 2 * c.scale), station.color, 0.78).strokeRoundedRect(p.x, p.y, width * c.scale, height * c.scale, 5 * c.scale);
        const label = this.project(station.x, station.y); this.stationLabels[index]?.setPosition(label.x, label.y).setScale(Math.max(0.72, c.scale));
      });
      this.drawMarketBoard();
      for (let index = 0; index < this.state.staff.analyst; index += 1) this.drawPerson(245 + index * 42, 365, RESEARCH, true);
      for (let index = 0; index < this.state.staff.trader; index += 1) this.drawPerson(505 + index * 42, 615, PORTFOLIO, true);
      for (let index = 0; index < this.state.staff.risk; index += 1) this.drawPerson(885 + index * 42, 445, RISK, true);
      this.drawPerson(this.state.playerX, this.state.playerY, PLAYER);
      this.drawHud();

      mount.dataset.fundX = this.state.playerX.toFixed(1);
      mount.dataset.fundY = this.state.playerY.toFixed(1);
      mount.dataset.fundMode = this.state.mode;
      mount.dataset.fundPositions = String(this.state.positions.length);
      mount.dataset.fundRegime = this.regime.id;
      mount.dataset.fundMandateCompliant = evaluateMandate(this.state, this.regime).compliant ? "true" : "false";
    }

    private drawMarketBoard() {
      const graphics = this.graphics; if (!graphics) return; const c = this.camera(); const p = this.project(405, 75);
      graphics.fillStyle(SCREEN, 0.98).fillRoundedRect(p.x, p.y, 235 * c.scale, 62 * c.scale, 4);
      fundAssets.forEach((asset, index) => {
        const move = this.state.prices[asset.id] / asset.basePrice - 1; const row = Math.floor(index / 3); const column = index % 3;
        const x = p.x + (22 + column * 75) * c.scale; const y = p.y + (20 + row * 26) * c.scale;
        graphics.fillStyle(move >= 0 ? PORTFOLIO : SHORT, 0.9).fillCircle(x, y, 3 * c.scale);
        graphics.fillStyle(0xa2b3b8, 0.5).fillRect(x + 7 * c.scale, y - c.scale, Math.min(40, 15 + Math.abs(move) * 300) * c.scale, 2 * c.scale);
      });
    }

    private drawPerson(x: number, y: number, color: number, small = false) {
      const graphics = this.graphics; if (!graphics) return; const p = this.project(x, y); const c = this.camera(); const scale = c.scale * (small ? 0.82 : 1);
      const bob = Math.sin((this.visualElapsed + x * 1.7) / 210) * 1.1 * scale;
      graphics.fillStyle(0x020406, 0.45).fillEllipse(p.x + 2 * scale, p.y + 8 * scale, 17 * scale, 7 * scale);
      graphics.fillStyle(color, 1).fillCircle(p.x, p.y - 2 * scale + bob, 8 * scale);
      graphics.fillStyle(0xf0c6a0, 1).fillCircle(p.x, p.y - 12 * scale + bob, 5 * scale);
    }

    private drawHud() {
      const stats = fundStats(this.state); const check = evaluateMandate(this.state, this.regime); const mobile = this.camera().mobile;
      const mandateColor = check.compliant ? "#78d6a8" : "#ed7d88";
      this.mandatePanel?.setColor(mandateColor).setText(`${this.regime.deskLabel} · ${this.regime.objective}${mobile ? "" : " · M = next mandate"}`);
      if (mobile) {
        this.hudLeft?.setText([`NAV ${money(stats.nav)} · P&L ${money(stats.pnl)} · ${Math.ceil(this.state.timeLeft)}s`, `Gross ${(stats.grossExposure * 100).toFixed(0)}%/${(this.regime.grossLimit * 100).toFixed(0)} · Beta ${pct(stats.betaExposure)} · LP ${Math.round(this.state.reputation)}`, `Team A/T/R ${this.state.staff.analyst}/${this.state.staff.trader}/${this.state.staff.risk}`]).setPosition(8, 8).setFontSize(10);
        this.hudRight?.setVisible(false); this.mandatePanel?.setPosition(this.scale.width / 2, 62).setFontSize(9).setWordWrapWidth(Math.max(220, this.scale.width - 24), true);
        this.news?.setPosition(this.scale.width / 2, 104).setFontSize(9).setWordWrapWidth(Math.max(220, this.scale.width - 24), true);
        this.prompt?.setFontSize(10).setWordWrapWidth(Math.max(220, this.scale.width - 28), true);
      } else {
        this.hudLeft?.setText([`NAV ${money(stats.nav)}   P&L ${money(stats.pnl)}`, `Gross ${(stats.grossExposure * 100).toFixed(0)}%   Net ${pct(stats.netExposure)}   Beta ${pct(stats.betaExposure)}`]).setPosition(14, 12).setFontSize(14);
        this.hudRight?.setText([`${Math.ceil(this.state.timeLeft)}s   LP ${Math.round(this.state.reputation)}`, `Ops ${money(this.state.operatingBudget)}   Team A/T/R ${this.state.staff.analyst}/${this.state.staff.trader}/${this.state.staff.risk}`]).setPosition(this.scale.width - 14, 12).setFontSize(13).setVisible(true);
        this.mandatePanel?.setPosition(this.scale.width / 2, 12).setFontSize(11).setWordWrapWidth(Math.min(600, Math.max(280, this.scale.width - 360)), true);
        this.news?.setPosition(this.scale.width / 2, 70).setFontSize(11).setWordWrapWidth(Math.min(520, Math.max(260, this.scale.width - 28)), true);
        this.prompt?.setFontSize(12).setWordWrapWidth(Math.min(680, Math.max(300, this.scale.width - 28)), true);
      }
      this.prompt?.setPosition(this.scale.width / 2, this.scale.height - 12).setText(check.compliant ? fundPrompt(this.state) : `${check.summary.toUpperCase()} · ${fundPrompt(this.state)}`);
      this.news?.setText(this.state.newsLabel ?? "").setAlpha(this.state.newsTimeLeft > 0 ? 1 : 0);
      const idea = fundAssetById(this.state.activeIdeaId);
      if (idea) {
        const signal = this.state.researchSignal === null ? `Dossier running · ${Math.ceil(this.state.researchTimer)}s` : `Signal ${this.state.researchSignal >= 0 ? "+" : ""}${this.state.researchSignal.toFixed(2)} · confidence ${(this.state.researchConfidence * 100).toFixed(0)}%`;
        this.ideaPanel?.setText([`ACTIVE THESIS · ${idea.ticker}`, signal, idea.thesis, `Bull: ${idea.bullCase}`, `Bear: ${idea.bearCase}`]).setAlpha(1);
      } else this.ideaPanel?.setAlpha(0);
      const positionLines = fundAssets.map((asset) => { const summary = positionSummary(this.state, asset.id as FundAssetId); return summary ? `${asset.ticker} ${summary.direction} ${money(Math.abs(summary.value))} · ${money(summary.pnl)}` : null; }).filter(Boolean) as string[];
      this.bookPanel?.setText(["PORTFOLIO", ...(positionLines.length ? positionLines : ["No positions"]), this.state.hedgeActive ? `Index hedge ${money(stats.hedgeNotional)}` : "Index hedge off"]);
      this.ideaPanel?.setVisible(!mobile); this.bookPanel?.setVisible(!mobile); this.touchInteract?.setVisible(mobile);
    }

    private interact() {
      if (!this.state || this.state.mode !== "playing") return;
      const result = interactFund(this.state); this.state = result.state; this.handleEvent(result.event); this.draw();
    }

    private handleEvent(event: FundEvent) {
      if (event === "none" || event === "collision") return;
      const stats = fundStats(this.state); const check = evaluateMandate(this.state, this.regime);
      if (event === "research_started") tone(390); if (event === "research_complete") tone(680, 0.09, 0.03);
      if (event === "trade_long") tone(760, 0.09, 0.03); if (event === "trade_short") tone(280, 0.09, 0.03);
      if (event === "idea_passed") tone(210); if (event === "hedge_set" || event === "hedge_cleared") tone(520);
      if (event === "staff_hired") tone(840, 0.08, 0.03); if (event === "hire_blocked") tone(150);
      if (event === "news") tone(610); if (event === "risk_alert") tone(130, 0.05, 0.02);
      if (event === "game_over") tone(95, 0.2, 0.04); if (event === "complete") tone(930, 0.16, 0.03);
      bridge.emit(`hedge_fund_${event}`, { nav: Math.round(stats.nav), pnl: Math.round(stats.pnl), gross_exposure: Number(stats.grossExposure.toFixed(3)), beta_exposure: Number(stats.betaExposure.toFixed(3)), reputation: Math.round(this.state.reputation), trades: this.state.trades, regime: this.regime.id, mandate_compliant: check.compliant });
      if (event === "complete" || event === "game_over") this.finishRun(event === "complete");
    }

    private finishRun(completed: boolean) {
      const score = fundScore(this.state) + regimeScoreAdjustment(this.state, this.regime); const stats = fundStats(this.state); const check = evaluateMandate(this.state, this.regime);
      if (score > bestScore) { bestScore = score; writeLocalGameValue(bridge.gameSlug, "hq-best", SAVE_VERSION, bestScore); }
      this.endTitle?.destroy(); this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height * 0.38, completed ? "MANDATE REVIEW" : "RISK LIMIT BREACHED", { color: completed ? "#78d6a8" : "#e37b8f", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "24px", fontStyle: "bold", backgroundColor: "#071014f2", padding: { x: 15, y: 9 } }).setOrigin(0.5).setDepth(60);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height * 0.51, [`${this.regime.label} · Score ${score}`, `NAV ${money(stats.nav)} · P&L ${money(stats.pnl)} · Max DD ${(this.state.maxDrawdown * 100).toFixed(1)}%`, `${check.summary} · LP confidence ${Math.round(this.state.reputation)}`, "R = rerun same mandate · M = rotate to next mandate"], { color: "#d5e0e3", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", align: "center", lineSpacing: 5, backgroundColor: "#09161bf2", padding: { x: 13, y: 10 } }).setOrigin(0.5).setDepth(60);
      bridge.setStatus(`${completed ? "Mandate review complete" : "Fund failed"} · ${this.regime.label} · score ${score}`);
    }

    private resetRun(nextMandate: boolean) {
      if (nextMandate) { runNumber += 1; writeLocalGameValue(bridge.gameSlug, "regime-run", SAVE_VERSION, runNumber); }
      this.regime = regimeForRun(runNumber);
      const seed = Math.floor((Date.now() / 137) % 0xffffffff);
      this.state = initializeRegimeState(createHedgeFundState(seed), this.regime);
      this.endTitle?.destroy(); this.endDetail?.destroy(); this.endTitle = undefined; this.endDetail = undefined; this.statusElapsed = 0; this.visualElapsed = 0;
      bridge.setStatus(`Hedge Fund HQ · ${this.regime.label} · ${FUND_SESSION_SECONDS}s`);
      bridge.emit("hedge_fund_started", { starting_nav: this.state.initialNav, regime: this.regime.id, gross_limit: this.regime.grossLimit, beta_limit: this.regime.betaLimit, drawdown_limit: this.regime.drawdownLimit });
      this.draw();
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
      this.hudLeft?.setPosition(gameSize.width < 650 ? 8 : 14, gameSize.width < 650 ? 8 : 12); this.hudRight?.setPosition(gameSize.width - 14, 12);
      this.mandatePanel?.setPosition(gameSize.width / 2, gameSize.width < 650 ? 62 : 12); this.news?.setPosition(gameSize.width / 2, gameSize.width < 650 ? 104 : 70);
      this.prompt?.setPosition(gameSize.width / 2, gameSize.height - 12); this.ideaPanel?.setPosition(12, gameSize.height - 12); this.bookPanel?.setPosition(gameSize.width - 12, gameSize.height - 12); this.touchInteract?.setPosition(gameSize.width - 64, gameSize.height - 46);
      if (this.endTitle) this.endTitle.setPosition(gameSize.width / 2, gameSize.height * 0.38); if (this.endDetail) this.endDetail.setPosition(gameSize.width / 2, gameSize.height * 0.51); this.draw();
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BG, transparent: false, scene: [HedgeFundRegimeScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });

  return {
    pause() { game.scene.pause("hedge-fund-regimes"); bridge.setStatus("Hedge Fund HQ paused"); },
    resume() { game.scene.resume("hedge-fund-regimes"); bridge.setStatus("Hedge Fund HQ resumed"); },
    restart() { game.scene.stop("hedge-fund-regimes"); game.scene.start("hedge-fund-regimes"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { delete mount.dataset.fundX; delete mount.dataset.fundY; delete mount.dataset.fundMode; delete mount.dataset.fundPositions; delete mount.dataset.fundRegime; delete mount.dataset.fundMandateCompliant; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
