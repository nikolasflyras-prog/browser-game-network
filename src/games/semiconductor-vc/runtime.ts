import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  SEMI_VC_FUND_SIZE,
  SEMI_VC_SESSION_SECONDS,
  SEMI_VC_WORLD,
  advanceSemiVc,
  createSemiVcState,
  interactSemiVc,
  semiVcActiveCompany,
  semiVcCompanies,
  semiVcDpi,
  semiVcExitCandidate,
  semiVcFundNav,
  semiVcLayout,
  semiVcPortfolioDecision,
  semiVcPrompt,
  semiVcQuarter,
  semiVcScore,
  semiVcTvpi,
  type SemiVcEvent,
  type SemiVcState,
} from "./model";

const SAVE_VERSION = 2;
const BACKGROUND = 0x05080b;
const FLOOR = 0x0e171c;
const GRID = 0x20323a;
const DESK_TOP = 0x31444d;
const DESK_SIDE = 0x17252b;
const PLAYER = 0xf7fafb;
const SHADOW = 0x010203;
const FOUNDER = 0x69d9ff;
const ANALYST = 0xa7b6bd;
const PARTNER = 0xffd166;
const PORTFOLIO = 0xb794f6;
const GREEN = 0x65e6b4;
const RED = 0xff7185;
const EXIT = 0x68e0b0;

type Point = { x: number; y: number };
type WorldLabel = { text: Phaser.GameObjects.Text; x: number; y: number };

function moneyMillions(value: number) {
  return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
}

function companyById(id: string | null) {
  return id ? semiVcCompanies.find((company) => company.id === id) ?? null : null;
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

  class SemiconductorVcScene extends Phaser.Scene {
    private state!: SemiVcState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private graphics?: Phaser.GameObjects.Graphics;
    private hudLeft?: Phaser.GameObjects.Text;
    private hudRight?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private news?: Phaser.GameObjects.Text;
    private dealPanel?: Phaser.GameObjects.Text;
    private portfolioPanel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private worldLabels: WorldLabel[] = [];
    private statusElapsed = 0;
    private visualElapsed = 0;

    constructor() {
      super("semiconductor-vc");
    }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.hudLeft = this.add.text(16, 13, "", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        backgroundColor: "#05080bd9",
        padding: { x: 8, y: 5 },
      }).setDepth(30);
      this.hudRight = this.add.text(this.scale.width - 16, 13, "", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        align: "right",
        backgroundColor: "#05080bd9",
        padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30);
      this.bestLabel = this.add.text(this.scale.width - 16, 55, `Best ${bestScore}`, {
        color: "#81969f",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
      }).setOrigin(1, 0).setDepth(30);
      this.news = this.add.text(this.scale.width / 2, 13, "", {
        color: "#ffd166",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
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
      this.dealPanel = this.add.text(14, this.scale.height - 14, "", {
        color: "#b9c9cf",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        lineSpacing: 3,
        wordWrap: { width: 340 },
        backgroundColor: "#071014ed",
        padding: { x: 9, y: 7 },
      }).setOrigin(0, 1).setDepth(31).setAlpha(0);
      this.portfolioPanel = this.add.text(this.scale.width - 14, this.scale.height - 96, "", {
        color: "#c8d7db",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        lineSpacing: 2,
        align: "right",
        backgroundColor: "#071014ed",
        padding: { x: 8, y: 6 },
      }).setOrigin(1, 1).setDepth(31).setAlpha(0);
      this.touchInteract = this.add.text(this.scale.width - 70, this.scale.height - 42, "INTERACT", {
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
        if (pointer.x >= this.scale.width - 132 && pointer.y >= this.scale.height - 78) this.interact();
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
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 132 && pointer.y >= this.scale.height - 78)) {
        const world = this.pointerToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const d = Math.hypot(dx, dy);
        if (d > 24) {
          x = dx / d;
          y = dy / d;
        }
      }

      const result = advanceSemiVc(this.state, { x, y }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
      this.statusElapsed += delta;
      if (this.statusElapsed >= 700 && this.state.mode === "playing") {
        this.statusElapsed = 0;
        bridge.setStatus(`Semiconductor VC · Q${semiVcQuarter(this.state)} · TVPI ${semiVcTvpi(this.state).toFixed(2)}x · DPI ${semiVcDpi(this.state).toFixed(2)}x`);
      }
    }

    private isMobileView() {
      return this.scale.width < 620;
    }

    private projection() {
      const mobile = this.isMobileView();
      const cameraX = mobile ? this.state.playerX : SEMI_VC_WORLD.width / 2;
      const cameraY = mobile ? this.state.playerY : SEMI_VC_WORLD.height / 2;
      const scale = mobile
        ? Math.max(0.62, Math.min(0.82, this.scale.width / 510))
        : Math.min((this.scale.width - 46) / 930, (this.scale.height - 92) / 490);
      return {
        mobile,
        cameraX,
        cameraY,
        scale,
        anchorX: this.scale.width / 2,
        anchorY: mobile ? this.scale.height * 0.53 : 58 + SEMI_VC_WORLD.height * 0.34 * scale,
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
        this.project(SEMI_VC_WORLD.width, 0),
        this.project(SEMI_VC_WORLD.width, SEMI_VC_WORLD.height),
        this.project(0, SEMI_VC_WORLD.height),
      ];
      this.polygon(corners.map((point) => ({ x: point.x + 10, y: point.y + 14 })), SHADOW, 0.72);
      this.polygon(corners, FLOOR, 1, GRID);
      graphics.lineStyle(Math.max(0.75, this.projection().scale), GRID, 0.42);
      for (let x = 0; x <= SEMI_VC_WORLD.width; x += 100) {
        const a = this.project(x, 0);
        const b = this.project(x, SEMI_VC_WORLD.height);
        graphics.lineBetween(a.x, a.y, b.x, b.y);
      }
      for (let y = 0; y <= SEMI_VC_WORLD.height; y += 80) {
        const a = this.project(0, y);
        const b = this.project(SEMI_VC_WORLD.width, y);
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
      this.polygon([down(p1), down(p2), down(p3), down(p4)], SHADOW, 0.54);
      this.polygon([p4, p3, down(p3), down(p4)], DESK_SIDE, 1);
      this.polygon([p2, p3, down(p3), down(p2)], 0x20343b, 1);
      this.polygon([p1, p2, p3, p4], DESK_TOP, 1, GRID);
      const monitor = this.project(x + width * 0.55, y + height * 0.35);
      const s = this.projection().scale;
      this.graphics?.fillStyle(0x05090b, 1).fillRoundedRect(monitor.x - 10 * s, monitor.y - 10 * s, 20 * s, 11 * s, 2);
      this.graphics?.fillStyle(0x5f9aa7, 0.55).fillRect(monitor.x - 7 * s, monitor.y - 7 * s, 14 * s, 2 * s);
    }

    private drawPerson(x: number, y: number, color: number, small = false) {
      const graphics = this.graphics;
      if (!graphics) return;
      const p = this.project(x, y);
      const s = this.projection().scale * (small ? 0.82 : 1);
      const bob = Math.sin((this.visualElapsed + x * 2.4) / 190) * 1.05 * s;
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
      this.graphics?.lineStyle(Math.max(1.3, 2.4 * this.projection().scale), color, 0.72).strokeCircle(p.x, p.y, r);
    }

    private buildWorldLabels() {
      const specs = [
        { label: "PITCH ROOMS", x: 175, y: 118, color: "#69d9ff" },
        { label: "DILIGENCE", x: semiVcLayout.diligence.x, y: semiVcLayout.diligence.y - 66, color: "#65e6b4" },
        { label: "INVESTMENT COMMITTEE", x: 760, y: 185, color: "#ffd166" },
        { label: "PORTFOLIO / RESERVES", x: 915, y: 470, color: "#b794f6" },
        { label: "LIQUIDITY / EXITS", x: semiVcLayout.exit.x, y: semiVcLayout.exit.y - 75, color: "#68e0b0" },
        { label: "RECRUITING", x: semiVcLayout.hire.x, y: semiVcLayout.hire.y - 62, color: "#a7b6bd" },
        { label: "NEWS WALL", x: semiVcLayout.news.x, y: semiVcLayout.news.y - 48, color: "#ff7185" },
      ];
      this.worldLabels = specs.map((spec) => ({
        text: this.add.text(0, 0, spec.label, {
          color: spec.color,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          backgroundColor: "#05080bcf",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1).setDepth(15),
        x: spec.x,
        y: spec.y,
      }));
    }

    private draw() {
      const graphics = this.graphics;
      if (!graphics) return;
      graphics.clear();
      graphics.fillStyle(BACKGROUND, 1).fillRect(0, 0, this.scale.width, this.scale.height);
      this.drawFloor();

      for (const rect of semiVcLayout.obstacles) this.drawDesk(rect.x, rect.y, rect.width, rect.height);

      for (let i = 0; i < this.state.staff; i += 1) this.drawPerson(375 + i * 55, 160, ANALYST, true);
      this.drawPerson(690, 145, PARTNER, true);
      this.drawPerson(745, 145, PARTNER, true);
      this.drawPerson(800, 145, PARTNER, true);

      this.drawZone(semiVcLayout.diligence.x, semiVcLayout.diligence.y, GREEN);
      this.drawZone(semiVcLayout.hire.x, semiVcLayout.hire.y, ANALYST);
      semiVcLayout.icPads.forEach((pad) => this.drawZone(pad.x, pad.y, pad.id === "pass" ? RED : PARTNER, 32));
      semiVcLayout.portfolioPads.forEach((pad) => this.drawZone(pad.x, pad.y, pad.id === "support" ? PORTFOLIO : RED, 32));
      this.drawZone(semiVcLayout.exit.x, semiVcLayout.exit.y, EXIT, 34);

      for (const founder of this.state.incoming) {
        this.drawPerson(founder.x, founder.y, FOUNDER);
        const p = this.project(founder.x, founder.y - 36);
        graphics.fillStyle(FOUNDER, 0.14).fillCircle(p.x, p.y, Math.max(12, 21 * this.projection().scale));
        const pct = Math.max(0, Math.min(1, founder.timeLeft / 30));
        graphics.lineStyle(Math.max(2, 4 * this.projection().scale), FOUNDER, 0.85);
        graphics.beginPath();
        graphics.arc(p.x, p.y, Math.max(12, 21 * this.projection().scale), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        graphics.strokePath();
      }

      const alertCompany = companyById(this.state.portfolioAlertCompanyId);
      if (alertCompany) {
        const p = this.project(915, 585);
        const pulse = 1 + Math.sin(this.visualElapsed / 180) * 0.12;
        graphics.lineStyle(3, PORTFOLIO, 0.9).strokeCircle(p.x, p.y, 44 * this.projection().scale * pulse);
      }

      const exitCandidate = semiVcExitCandidate(this.state);
      if (exitCandidate && !this.state.portfolioAlertCompanyId) {
        const p = this.project(semiVcLayout.exit.x, semiVcLayout.exit.y);
        const pulse = 1 + Math.sin(this.visualElapsed / 210) * 0.13;
        graphics.lineStyle(3, EXIT, 0.95).strokeCircle(p.x, p.y, 47 * this.projection().scale * pulse);
      }

      this.drawPerson(this.state.playerX, this.state.playerY, PLAYER);
      const player = this.project(this.state.playerX, this.state.playerY);
      if (this.state.activeDealId) {
        graphics.fillStyle(PARTNER, 1).fillRoundedRect(player.x + 8, player.y - 39, 16, 11, 2);
        graphics.lineStyle(1, BACKGROUND, 0.8).strokeRoundedRect(player.x + 8, player.y - 39, 16, 11, 2);
      }

      for (const label of this.worldLabels) {
        const p = this.project(label.x, label.y);
        label.text.setPosition(p.x, p.y);
        label.text.setVisible(p.x > -120 && p.x < this.scale.width + 120 && p.y > -80 && p.y < this.scale.height + 80);
      }

      const nav = semiVcFundNav(this.state);
      const mobile = this.isMobileView();
      this.hudLeft?.setText(mobile
        ? [`Q${semiVcQuarter(this.state)} · TVPI ${semiVcTvpi(this.state).toFixed(2)}x · DPI ${semiVcDpi(this.state).toFixed(2)}x`, `NAV ${moneyMillions(nav)} · Dry ${moneyMillions(this.state.dryPowder)}`, `Rep ${Math.round(this.state.reputation)} · Ops ${moneyMillions(this.state.operatingBudget)}`]
        : [`Q${semiVcQuarter(this.state)} · TVPI ${semiVcTvpi(this.state).toFixed(2)}x · DPI ${semiVcDpi(this.state).toFixed(2)}x`, `NAV ${moneyMillions(nav)} · Dry ${moneyMillions(this.state.dryPowder)} · Dist ${moneyMillions(this.state.distributions)}`]);
      const minutes = Math.floor(this.state.timeLeft / 60);
      const seconds = Math.ceil(this.state.timeLeft % 60).toString().padStart(2, "0");
      this.hudRight?.setText([`${minutes}:${seconds} · Staff ${this.state.staff}`, `Portfolio ${this.state.holdings.length} · Exits ${this.state.exits}`, `Reserves ${moneyMillions(this.state.reserveSpent)} · Ops ${moneyMillions(this.state.operatingBudget)}`]).setVisible(!mobile);
      this.bestLabel?.setText(`Best ${bestScore}`).setVisible(!mobile);
      this.prompt?.setText(`${semiVcPrompt(this.state)}  ·  WASD/ARROWS + E`);
      this.news?.setText(this.state.newsLabel ? `NEWS · ${this.state.newsLabel}` : "");
      this.news?.setAlpha(this.state.newsLabel ? 1 : 0);
      this.news?.setPosition(this.scale.width / 2, mobile ? 84 : 13);

      const active = semiVcActiveCompany(this.state);
      if (active) {
        const diligence = this.state.activeDealDiligenced ? `\nDILIGENCE: ${active.hiddenInsight}` : "\nDILIGENCE: walk the file to the analyst station.";
        const flags = active.redFlag ? `\nRISK: ${active.redFlag}` : active.greenFlag ? `\nSIGNAL: ${active.greenFlag}` : "";
        this.dealPanel?.setText(
          `${active.name} · ${active.round} · raising ${moneyMillions(active.raiseAmount)} at ${moneyMillions(active.preMoney)} pre\n` +
          `${active.sector} · ${active.processNode} · ${active.designStage}\n` +
          `Foundry ${active.foundry} · ${active.designWins} design wins · customer concentration ${active.customerConcentrationPct}%${flags}${diligence}`,
        );
        this.dealPanel?.setAlpha(1);
      } else if (alertCompany) {
        const decision = semiVcPortfolioDecision(this.state);
        const holding = this.state.holdings.find((item) => item.companyId === alertCompany.id);
        this.dealPanel?.setText(
          `PORTFOLIO DECISION · ${alertCompany.name}\n${this.state.portfolioAlertHeadline ?? "Company needs a decision."}\n` +
          `Ownership ${holding?.ownershipPct.toFixed(1) ?? "—"}% · carrying value ${moneyMillions(holding?.mark ?? 0)}\n` +
          `${decision?.supportLabel ?? "Support"} or decline and accept the dilution / operating consequence.`,
        );
        this.dealPanel?.setAlpha(1);
      } else if (exitCandidate) {
        const company = companyById(exitCandidate.companyId);
        this.dealPanel?.setText(
          `LIQUIDITY WINDOW · ${company?.name ?? exitCandidate.companyId}\n` +
          `Carry ${moneyMillions(exitCandidate.mark)} on ${moneyMillions(exitCandidate.invested)} invested · ${(exitCandidate.mark / exitCandidate.invested).toFixed(2)}x\n` +
          `Walk to LIQUIDITY / EXITS to turn unrealized value into distributions and DPI.`,
        );
        this.dealPanel?.setAlpha(1);
      } else {
        this.dealPanel?.setAlpha(0);
      }

      if (this.state.holdings.length && !mobile) {
        const lines = this.state.holdings.slice(0, 5).map((holding) => {
          const company = companyById(holding.companyId);
          return `${company?.name ?? holding.companyId} · ${holding.ownershipPct.toFixed(1)}% · ${(holding.mark / holding.invested).toFixed(2)}x`;
        });
        this.portfolioPanel?.setText(["PORTFOLIO BOOK", ...lines]).setAlpha(1);
      } else {
        this.portfolioPanel?.setAlpha(0);
      }

      const buttonX = this.scale.width - 124;
      const buttonY = this.scale.height - 66;
      graphics.fillStyle(0x0c171c, 0.95).fillRoundedRect(buttonX, buttonY, 108, 48, 10);
      graphics.lineStyle(1.5, GREEN, 0.8).strokeRoundedRect(buttonX, buttonY, 108, 48, 10);

      mount.dataset.semiX = this.state.playerX.toFixed(1);
      mount.dataset.semiY = this.state.playerY.toFixed(1);
      mount.dataset.semiActive = this.state.activeDealId ?? "";
      mount.dataset.semiDiligenced = this.state.activeDealDiligenced ? "true" : "false";
      mount.dataset.semiInvestments = String(this.state.investments);
      mount.dataset.semiStaff = String(this.state.staff);
      mount.dataset.semiHoldings = String(this.state.holdings.length);
      mount.dataset.semiMode = this.state.mode;
      mount.dataset.semiMoic = semiVcTvpi(this.state).toFixed(3);
      mount.dataset.semiTvpi = semiVcTvpi(this.state).toFixed(3);
      mount.dataset.semiDpi = semiVcDpi(this.state).toFixed(3);
      mount.dataset.semiDistributions = String(Math.round(this.state.distributions));
      mount.dataset.semiExits = String(this.state.exits);
      mount.dataset.semiPortfolioKind = this.state.portfolioAlertKind ?? "";
      mount.dataset.semiQuarter = String(semiVcQuarter(this.state));
    }

    private interact() {
      if (!this.state || this.state.mode !== "playing") return;
      const before = this.state;
      const result = interactSemiVc(before);
      if (result.state === before && result.event === "none") return;
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
    }

    private handleEvent(event: SemiVcEvent) {
      if (event === "none") return;
      const active = semiVcActiveCompany(this.state);

      if (event === "deal_picked_up") {
        tone(520);
        bridge.emit("game_action", { action: "founder_meeting", company: this.state.activeDealId });
        bridge.setStatus(`${active?.name ?? "Deal"} file picked up — diligence or investment committee next`);
      } else if (event === "diligence_complete") {
        tone(680, 0.1, 0.04);
        bridge.emit("game_action", { action: "diligence", company: this.state.activeDealId, staff: this.state.staff });
        bridge.setStatus("Diligence complete — hidden semiconductor risk/signal added to the deal file");
      } else if (event === "investment_made") {
        tone(820, 0.12, 0.045);
        bridge.emit("level_completed", { action: "investment", investments: this.state.investments, dry_powder: this.state.dryPowder, fund_tvpi: semiVcTvpi(this.state) });
        bridge.setStatus(`Investment approved — portfolio ${this.state.holdings.length} · dry powder ${moneyMillions(this.state.dryPowder)}`);
      } else if (event === "deal_passed") {
        tone(260);
        bridge.emit("game_action", { action: "pass", passes: this.state.passes });
        bridge.setStatus("Deal passed — keep moving; new founders continue arriving");
      } else if (event === "staff_hired") {
        tone(610);
        bridge.emit("game_action", { action: "hire_analyst", staff: this.state.staff, operating_budget: this.state.operatingBudget });
        bridge.setStatus("Analyst hired — diligence cooldown is now shorter");
      } else if (event === "portfolio_alert") {
        tone(390, 0.11, 0.04);
        bridge.emit("game_action", { action: "portfolio_event", company: this.state.portfolioAlertCompanyId, kind: this.state.portfolioAlertKind });
        bridge.setStatus(this.state.portfolioAlertHeadline ?? "Portfolio company needs a reserve decision");
      } else if (event === "follow_on") {
        tone(760, 0.1, 0.04);
        bridge.emit("game_action", { action: "portfolio_support", dry_powder: this.state.dryPowder, operating_budget: this.state.operatingBudget, reserve_spent: this.state.reserveSpent });
        bridge.setStatus("Portfolio support approved — check ownership, reserves, and carrying value");
      } else if (event === "follow_on_declined") {
        tone(190);
        bridge.emit("game_action", { action: "decline_portfolio_event" });
        bridge.setStatus("Portfolio event declined — ownership / mark impact booked");
      } else if (event === "exit_realized") {
        tone(960, 0.15, 0.05);
        bridge.emit("level_completed", { action: "exit_realized", distributions: this.state.distributions, dpi: semiVcDpi(this.state), tvpi: semiVcTvpi(this.state), exits: this.state.exits });
        bridge.setStatus(`Exit realized — distributions ${moneyMillions(this.state.distributions)} · DPI ${semiVcDpi(this.state).toFixed(2)}x`);
      } else if (event === "news") {
        tone(470, 0.07, 0.025);
        bridge.emit("game_action", { action: "news_event", headline: this.state.newsLabel });
      } else if (event === "founder_missed") {
        tone(145, 0.09, 0.04);
        bridge.emit("game_action", { action: "missed_founder", missed: this.state.missedDeals });
      } else if (event === "complete" || event === "game_over") {
        this.endRun(event === "game_over");
      }
    }

    private endRun(fired: boolean) {
      const score = semiVcScore(this.state);
      bestScore = Math.max(bestScore, score);
      writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      const nav = semiVcFundNav(this.state);
      bridge.emit("game_over", {
        score,
        fund_tvpi: semiVcTvpi(this.state),
        fund_dpi: semiVcDpi(this.state),
        nav,
        distributions: this.state.distributions,
        investments: this.state.investments,
        exits: this.state.exits,
        passes: this.state.passes,
        missed_deals: this.state.missedDeals,
        staff: this.state.staff,
        reputation: this.state.reputation,
        fired,
      });
      bridge.setStatus(`${fired ? "Partnership lost confidence" : "Fund cycle complete"} — TVPI ${semiVcTvpi(this.state).toFixed(2)}x · DPI ${semiVcDpi(this.state).toFixed(2)}x · score ${score}`);

      this.endTitle?.destroy();
      this.endDetail?.destroy();
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, fired ? "PARTNERSHIP ENDED" : "FUND REVIEW", {
        color: "#f7fafb",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        backgroundColor: "#05080bf2",
        padding: { x: 18, y: 12 },
      }).setOrigin(0.5).setDepth(40);
      this.endDetail = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 35,
        `TVPI ${semiVcTvpi(this.state).toFixed(2)}x · DPI ${semiVcDpi(this.state).toFixed(2)}x · NAV ${moneyMillions(nav)}\n` +
        `${this.state.investments} investments · ${this.state.exits} exits · distributions ${moneyMillions(this.state.distributions)}\n` +
        `${this.state.staff} staff · reputation ${Math.round(this.state.reputation)} · score ${score}\nPress R or Restart to run another fund`,
        {
          color: "#b9c9cf",
          align: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "14px",
          lineSpacing: 6,
          backgroundColor: "#05080bf2",
          padding: { x: 18, y: 12 },
        },
      ).setOrigin(0.5).setDepth(40);
      tone(fired ? 110 : 620, 0.25, 0.055);
      this.draw();
    }

    private resetRun() {
      this.endTitle?.destroy();
      this.endDetail?.destroy();
      this.endTitle = undefined;
      this.endDetail = undefined;
      this.state = createSemiVcState((Date.now() ^ 0x9e3779b9) >>> 0);
      this.statusElapsed = 0;
      this.visualElapsed = 0;
      this.draw();
      bridge.setStatus("Semiconductor VC · source → diligence → invest → reserve → exit");
      bridge.emit("game_started", { mode: "walkable-vc-fund", fund_size: SEMI_VC_FUND_SIZE, session_seconds: SEMI_VC_SESSION_SECONDS });
    }

    private handleResize() {
      this.hudRight?.setPosition(this.scale.width - 16, 13);
      this.bestLabel?.setPosition(this.scale.width - 16, 55);
      this.news?.setPosition(this.scale.width / 2, this.isMobileView() ? 84 : 13);
      this.prompt?.setPosition(this.scale.width / 2, this.scale.height - 13);
      this.dealPanel?.setPosition(14, this.scale.height - 14);
      this.portfolioPanel?.setPosition(this.scale.width - 14, this.scale.height - 96);
      this.touchInteract?.setPosition(this.scale.width - 70, this.scale.height - 42);
      this.endTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 30);
      this.endDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 35);
      this.draw();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BACKGROUND,
    transparent: false,
    scene: [SemiconductorVcScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() {
      game.scene.pause("semiconductor-vc");
      bridge.setStatus("Paused");
    },
    resume() {
      game.scene.resume("semiconductor-vc");
      bridge.setStatus("Semiconductor VC office resumed");
    },
    restart() {
      game.scene.stop("semiconductor-vc");
      game.scene.start("semiconductor-vc");
    },
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
    },
    destroy() {
      for (const key of ["semiX", "semiY", "semiActive", "semiDiligenced", "semiInvestments", "semiStaff", "semiHoldings", "semiMode", "semiMoic", "semiTvpi", "semiDpi", "semiDistributions", "semiExits", "semiPortfolioKind", "semiQuarter"]) {
        delete mount.dataset[key];
      }
      game.destroy(true);
      void audioContext?.close();
      audioContext = null;
    },
  } satisfies GameRuntimeController;
}
