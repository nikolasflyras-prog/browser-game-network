import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { MARKET_SESSION_SECONDS, MARKET_WORLD, advanceMarketFloor, createMarketFloorState, interactMarketFloor, marketFloorLayout, marketFloorPnl, marketFloorPrompt, marketFloorQuote, scoreMarketFloor, type MarketFloorEvent, type MarketFloorState } from "./model";

const SAVE_VERSION = 2;
const BACKGROUND = 0x050a0c;
const FLOOR = 0x0b191c;
const GRID = 0x16363b;
const DESK_TOP = 0x284449;
const DESK_SIDE = 0x12282c;
const PLAYER = 0xf5fbf7;
const SHADOW = 0x010405;
const BUY = 0x63d7ff;
const SELL = 0xff9b67;
const HEDGE = 0xb794f6;
const VENUE_COLORS = { alpha: 0x64e6b5, beta: 0xffd166, gamma: 0xff7185 } as const;

type WorldLabel = { text: Phaser.GameObjects.Text; x: number; y: number };
type Point = { x: number; y: number };

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "arcade-best", SAVE_VERSION) ?? 0;

  const tone = (frequency: number, duration = 0.06, volume = 0.03) => {
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
    } catch { /* audio is optional */ }
  };

  class MarketMakerArcadeScene extends Phaser.Scene {
    private state!: MarketFloorState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private graphics?: Phaser.GameObjects.Graphics;
    private pnlLabel?: Phaser.GameObjects.Text;
    private marketLabel?: Phaser.GameObjects.Text;
    private timeLabel?: Phaser.GameObjects.Text;
    private promptLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private shockLabel?: Phaser.GameObjects.Text;
    private endTitle?: Phaser.GameObjects.Text;
    private endDetail?: Phaser.GameObjects.Text;
    private worldLabels: WorldLabel[] = [];
    private statusElapsed = 0;
    private elapsedVisual = 0;

    constructor() { super("market-maker-arcade"); }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.pnlLabel = this.add.text(18, 14, "P&L $0.00", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "17px", fontStyle: "bold" }).setDepth(20);
      this.marketLabel = this.add.text(this.scale.width / 2, 15, "FAIR 100.00", { color: "#a7c0c4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(20);
      this.timeLabel = this.add.text(this.scale.width - 18, 14, "3:30", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "17px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(20);
      this.bestLabel = this.add.text(this.scale.width - 18, 38, `Best ${bestScore}`, { color: "#78949a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(20);
      this.promptLabel = this.add.text(this.scale.width / 2, this.scale.height - 14, "MOVE · FIND CLIENT FLOW", { color: "#f5fbf7", backgroundColor: "#050a0ce8", padding: { x: 9, y: 5 }, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5, 1).setDepth(22);
      this.shockLabel = this.add.text(this.scale.width / 2, 45, "", { color: "#ff7185", backgroundColor: "#050a0cdd", padding: { x: 8, y: 4 }, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(22).setAlpha(0);
      this.buildWorldLabels();
      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 132 && pointer.y >= this.scale.height - 72) this.interact();
      });
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }

    update(_time: number, delta: number) {
      if (!this.state || this.state.mode !== "playing") return;
      this.elapsedVisual += delta;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));
      const pointer = this.input.activePointer;
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 132 && pointer.y >= this.scale.height - 72)) {
        const world = this.pointerToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const d = Math.hypot(dx, dy);
        if (d > 24) { x = dx / d; y = dy / d; }
      }
      const result = advanceMarketFloor(this.state, { x, y, dash: Boolean(this.keys.SHIFT?.isDown) }, delta / 1000);
      this.state = result.state;
      this.handleEvent(result.event);
      this.draw();
      this.statusElapsed += delta;
      if (this.statusElapsed >= 700 && this.state.mode === "playing") {
        this.statusElapsed = 0;
        bridge.setStatus(`Trading floor live · ${Math.ceil(this.state.timeLeft)}s · ${this.state.completed} clients · inventory ${this.state.inventory}`);
      }
    }

    private isMobileView() { return this.scale.width < 620; }

    private projection() {
      const mobile = this.isMobileView();
      const cameraX = mobile ? this.state.playerX : MARKET_WORLD.width / 2;
      const cameraY = mobile ? this.state.playerY : MARKET_WORLD.height / 2;
      const scale = mobile
        ? Math.max(0.58, Math.min(0.82, this.scale.width / 520))
        : Math.min((this.scale.width - 48) / 850, (this.scale.height - 86) / 450);
      const anchorX = this.scale.width / 2;
      const anchorY = mobile ? this.scale.height * 0.53 : 56 + MARKET_WORLD.height * 0.34 * scale;
      return { mobile, cameraX, cameraY, scale, anchorX, anchorY };
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
      const dyProjected = (screenY - p.anchorY) / p.scale;
      const dy = dyProjected / 0.68;
      const dxProjected = (screenX - p.anchorX) / p.scale;
      const dx = (dxProjected - dy * 0.18) / 0.72;
      return { x: p.cameraX + dx, y: p.cameraY + dy };
    }

    private polygon(points: Point[], fill: number, alpha = 1, stroke?: number) {
      const graphics = this.graphics; if (!graphics || points.length < 3) return;
      graphics.fillStyle(fill, alpha); graphics.beginPath(); graphics.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
      graphics.closePath(); graphics.fillPath();
      if (stroke !== undefined) { graphics.lineStyle(1.25, stroke, 0.8); graphics.strokePath(); }
    }

    private drawDesk(x: number, y: number, width: number, height: number) {
      const p1 = this.project(x, y); const p2 = this.project(x + width, y); const p3 = this.project(x + width, y + height); const p4 = this.project(x, y + height);
      const depth = Math.max(5, 12 * this.projection().scale);
      const down = (point: Point) => ({ x: point.x, y: point.y + depth });
      this.polygon([down(p1), down(p2), down(p3), down(p4)], SHADOW, 0.58);
      this.polygon([p4, p3, down(p3), down(p4)], DESK_SIDE, 1);
      this.polygon([p2, p3, down(p3), down(p2)], 0x173136, 1);
      this.polygon([p1, p2, p3, p4], DESK_TOP, 1, GRID);
      const screen = this.project(x + width * 0.52, y + height * 0.38);
      const monitorW = Math.max(5, 17 * this.projection().scale); const monitorH = Math.max(3, 9 * this.projection().scale);
      this.graphics?.fillStyle(0x071214, 1).fillRoundedRect(screen.x - monitorW / 2, screen.y - monitorH, monitorW, monitorH, 2);
      this.graphics?.fillStyle(0x5b8f98, 0.5).fillRect(screen.x - monitorW * 0.35, screen.y - monitorH * 0.72, monitorW * 0.7, Math.max(1, monitorH * 0.18));
    }

    private drawPerson(x: number, y: number, color: number, facing = 1, small = false) {
      const graphics = this.graphics; if (!graphics) return;
      const p = this.project(x, y); const s = this.projection().scale * (small ? 0.82 : 1);
      const bob = Math.sin((this.elapsedVisual + x * 2.7) / 170) * 1.1 * s;
      graphics.fillStyle(SHADOW, 0.5).fillEllipse(p.x + 2 * s, p.y + 11 * s, 24 * s, 8 * s);
      graphics.lineStyle(Math.max(1, 3 * s), color, 1); graphics.lineBetween(p.x - 4 * s, p.y + 2 * s + bob, p.x - 6 * s, p.y + 13 * s); graphics.lineBetween(p.x + 4 * s, p.y + 2 * s + bob, p.x + 6 * s, p.y + 13 * s);
      graphics.fillStyle(color, 1).fillRoundedRect(p.x - 8 * s, p.y - 12 * s + bob, 16 * s, 17 * s, 5 * s);
      graphics.fillStyle(0xf1c7a2, 1).fillCircle(p.x + facing * 1.5 * s, p.y - 18 * s + bob, 6.5 * s);
    }

    private buildWorldLabels() {
      const specs = [
        ...marketFloorLayout.clientSpots.map((spot, index) => ({ label: `CLIENT ${index + 1}`, x: spot.x - 20, y: spot.y - 58, color: "#63d7ff" })),
        ...marketFloorLayout.venues.map((venue) => ({ label: venue.label, x: venue.x, y: venue.y - 64, color: venue.id === "alpha" ? "#64e6b5" : venue.id === "beta" ? "#ffd166" : "#ff7185" })),
        { label: "HEDGE", x: marketFloorLayout.hedge.x, y: marketFloorLayout.hedge.y - 62, color: "#b794f6" },
      ];
      this.worldLabels = specs.map((spec) => ({ text: this.add.text(0, 0, spec.label, { color: spec.color, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontStyle: "bold", backgroundColor: "#050a0cc4", padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(14), x: spec.x, y: spec.y }));
    }

    private drawFloor() {
      const graphics = this.graphics; if (!graphics) return;
      const corners = [this.project(0, 0), this.project(MARKET_WORLD.width, 0), this.project(MARKET_WORLD.width, MARKET_WORLD.height), this.project(0, MARKET_WORLD.height)];
      this.polygon(corners.map((point) => ({ x: point.x + 9, y: point.y + 14 })), SHADOW, 0.72);
      this.polygon(corners, FLOOR, 1, GRID);
      graphics.lineStyle(Math.max(0.8, this.projection().scale), GRID, 0.44);
      for (let x = 0; x <= MARKET_WORLD.width; x += 100) { const a = this.project(x, 0); const b = this.project(x, MARKET_WORLD.height); graphics.lineBetween(a.x, a.y, b.x, b.y); }
      for (let y = 0; y <= MARKET_WORLD.height; y += 80) { const a = this.project(0, y); const b = this.project(MARKET_WORLD.width, y); graphics.lineBetween(a.x, a.y, b.x, b.y); }
    }

    private draw() {
      const graphics = this.graphics; if (!graphics) return;
      graphics.clear(); graphics.fillStyle(BACKGROUND, 1).fillRect(0, 0, this.scale.width, this.scale.height);
      this.drawFloor();
      for (const rect of marketFloorLayout.obstacles) this.drawDesk(rect.x, rect.y, rect.width, rect.height);

      marketFloorLayout.clientSpots.forEach((spot, index) => this.drawPerson(112, spot.y + 10, index % 2 ? 0xb2c7cb : 0x8ca8ae, 1, true));
      marketFloorLayout.venues.forEach((venue) => this.drawPerson(900, venue.y + 8, 0xb2c7cb, -1, true));

      const scale = this.projection().scale;
      for (const venue of marketFloorLayout.venues) {
        const p = this.project(venue.x, venue.y); const color = VENUE_COLORS[venue.id]; const radius = Math.max(18, 34 * scale);
        graphics.fillStyle(color, 0.1).fillCircle(p.x, p.y, radius); graphics.lineStyle(Math.max(1.5, 3 * scale), color, 0.95).strokeCircle(p.x, p.y, radius);
        const quote = marketFloorQuote(this.state, venue.id); const bar = Math.max(16, 42 * scale); graphics.fillStyle(color, 0.86).fillRect(p.x - bar / 2, p.y - Math.max(2, 3 * scale), bar, Math.max(3, 5 * scale));
        const spreadHeat = Math.min(1, (quote.ask - quote.bid) / 1.7); graphics.fillStyle(color, 0.24 + spreadHeat * 0.28).fillCircle(p.x, p.y, Math.max(7, 11 * scale));
      }

      const hedge = this.project(marketFloorLayout.hedge.x, marketFloorLayout.hedge.y); const hedgeRadius = Math.max(17, 32 * scale);
      graphics.fillStyle(HEDGE, 0.1).fillCircle(hedge.x, hedge.y, hedgeRadius); graphics.lineStyle(Math.max(1.5, 3 * scale), HEDGE, 0.95).strokeCircle(hedge.x, hedge.y, hedgeRadius);
      graphics.lineBetween(hedge.x - 10 * scale, hedge.y, hedge.x + 10 * scale, hedge.y); graphics.lineBetween(hedge.x, hedge.y - 10 * scale, hedge.x, hedge.y + 10 * scale);

      for (const order of this.state.orders) {
        const p = this.project(order.x, order.y); const color = order.side === "buy" ? BUY : SELL; const urgency = Math.max(0, Math.min(1, order.timeLeft / 14)); const pulse = 1 + Math.sin((this.elapsedVisual + order.id * 310) / 180) * 0.08;
        graphics.fillStyle(color, 0.11 + (1 - urgency) * 0.18).fillCircle(p.x, p.y, Math.max(14, 23 * scale) * pulse); graphics.lineStyle(Math.max(1.5, 3 * scale), color, 1).strokeCircle(p.x, p.y, Math.max(9, 15 * scale));
        const cube = Math.max(7, 12 * scale); graphics.fillStyle(color, 1).fillRoundedRect(p.x - cube / 2, p.y - cube / 2, cube, cube, Math.max(2, 3 * scale));
      }

      this.drawPerson(this.state.playerX, this.state.playerY, PLAYER, 1, false);
      const player = this.project(this.state.playerX, this.state.playerY);
      if (this.state.carried) { const color = this.state.carried.side === "buy" ? BUY : SELL; graphics.fillStyle(color, 1).fillCircle(player.x + 14 * scale, player.y - 26 * scale, Math.max(4, 6 * scale)); graphics.lineStyle(Math.max(1, 2 * scale), color, 0.85).strokeCircle(player.x + 14 * scale, player.y - 26 * scale, Math.max(7, 10 * scale)); }

      for (const label of this.worldLabels) { const p = this.project(label.x, label.y); label.text.setPosition(p.x, p.y).setScale(Math.max(0.78, Math.min(1, scale))); }

      const mobile = this.isMobileView(); const seconds = Math.ceil(this.state.timeLeft); const prompt = marketFloorPrompt(this.state); const pnl = marketFloorPnl(this.state);
      if (mobile) {
        this.pnlLabel?.setPosition(12, 10).setFontSize(13).setText(`P&L $${pnl.toFixed(2)} · Inv ${this.state.inventory}`);
        this.marketLabel?.setOrigin(0, 0).setPosition(12, 31).setFontSize(10).setText(`Fair ${this.state.fairValue.toFixed(2)} · Rep ${Math.round(this.state.reputation)}`);
        this.timeLabel?.setPosition(this.scale.width - 12, 10).setFontSize(14).setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
        this.bestLabel?.setPosition(this.scale.width - 12, 31).setFontSize(9).setText(`${this.state.completed} clients · Dash ${Math.round(this.state.dashEnergy)}%`);
      } else {
        this.pnlLabel?.setPosition(18, 14).setFontSize(17).setText(`P&L $${pnl.toFixed(2)} · Inv ${this.state.inventory} · Rep ${Math.round(this.state.reputation)}`);
        this.marketLabel?.setOrigin(0.5, 0).setPosition(this.scale.width / 2, 15).setFontSize(13).setText(`FAIR ${this.state.fairValue.toFixed(2)} · Clients ${this.state.completed} · Risk ${this.state.riskCost.toFixed(1)}`);
        this.timeLabel?.setPosition(this.scale.width - 18, 14).setFontSize(17).setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
        this.bestLabel?.setPosition(this.scale.width - 18, 38).setFontSize(11).setText(`Best ${bestScore} · Dash ${Math.round(this.state.dashEnergy)}%`);
      }
      this.promptLabel?.setPosition(this.scale.width / 2, this.scale.height - 12).setFontSize(mobile ? 10 : 12).setText(`E / SPACE · ${prompt}`);
      this.shockLabel?.setPosition(this.scale.width / 2, mobile ? 52 : 45).setFontSize(mobile ? 11 : 14).setText(this.state.shockLabel ?? "").setAlpha(this.state.shockLabel ? 1 : 0);

      graphics.fillStyle(0x071214, 0.92).fillRoundedRect(this.scale.width - (mobile ? 102 : 132), this.scale.height - (mobile ? 55 : 66), mobile ? 90 : 118, mobile ? 38 : 46, 8); graphics.lineStyle(1.5, 0x56747b, 0.9).strokeRoundedRect(this.scale.width - (mobile ? 102 : 132), this.scale.height - (mobile ? 55 : 66), mobile ? 90 : 118, mobile ? 38 : 46, 8);

      mount.dataset.marketArcade = "true";
      mount.dataset.marketMode = this.state.mode;
      mount.dataset.marketPlayerX = this.state.playerX.toFixed(1);
      mount.dataset.marketPlayerY = this.state.playerY.toFixed(1);
      mount.dataset.marketInventory = String(this.state.inventory);
      mount.dataset.marketCompleted = String(this.state.completed);
      mount.dataset.marketCarried = this.state.carried ? String(this.state.carried.id) : "";
      mount.dataset.marketScore = String(scoreMarketFloor(this.state));
      mount.dataset.marketTime = this.state.timeLeft.toFixed(1);
    }

    private interact() {
      if (!this.state || this.state.mode !== "playing") return;
      const result = interactMarketFloor(this.state); this.state = result.state; this.handleEvent(result.event); this.draw();
    }

    private handleEvent(event: MarketFloorEvent) {
      if (event === "none") return;
      if (event === "picked_up") { tone(520); bridge.emit("game_action", { action: "client_order_picked_up", completed: this.state.completed }); }
      else if (event === "filled") { tone(760, 0.08, 0.04); bridge.emit("game_action", { action: "client_order_filled", completed: this.state.completed, inventory: this.state.inventory, pnl: Number(marketFloorPnl(this.state).toFixed(2)) }); }
      else if (event === "rejected") { tone(170, 0.09, 0.04); bridge.emit("game_action", { action: "venue_rejected", reputation: this.state.reputation }); }
      else if (event === "hedged") { tone(430); bridge.emit("game_action", { action: "inventory_hedged", inventory: this.state.inventory }); }
      else if (event === "order_missed") { tone(120, 0.14, 0.05); bridge.emit("game_action", { action: "client_order_missed", missed: this.state.missed, reputation: this.state.reputation }); }
      else if (event === "shock") { tone(this.state.shockStrength > 0 ? 690 : 230, 0.16, 0.045); bridge.emit("game_action", { action: "market_shock", shock: this.state.shockLabel, fair_value: this.state.fairValue }); }
      else if (event === "complete" || event === "game_over") this.endRun(event === "complete");
    }

    private endRun(closingBell: boolean) {
      const score = scoreMarketFloor(this.state); bestScore = Math.max(bestScore, score); writeLocalGameValue(bridge.gameSlug, "arcade-best", SAVE_VERSION, bestScore);
      bridge.emit("game_over", { score, completed: this.state.completed, missed: this.state.missed, inventory: this.state.inventory, pnl: Number(marketFloorPnl(this.state).toFixed(2)), closing_bell: closingBell, best_score: bestScore });
      bridge.setStatus(`${closingBell ? "Closing bell" : "Desk lost"} · ${this.state.completed} clients · score ${score} · press R to retry`);
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 24, closingBell ? "CLOSING BELL" : "DESK LOST", { color: "#f5fbf7", backgroundColor: "#050a0ce8", padding: { x: 12, y: 8 }, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "28px", fontStyle: "bold" }).setOrigin(0.5).setDepth(30);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 32, `${this.state.completed} clients · P&L $${marketFloorPnl(this.state).toFixed(2)} · Inventory ${this.state.inventory}\nScore ${score} · Press R or Restart`, { color: "#9db3b7", backgroundColor: "#050a0ce8", padding: { x: 12, y: 8 }, align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", lineSpacing: 6 }).setOrigin(0.5).setDepth(30);
      tone(closingBell ? 620 : 110, 0.22, 0.055);
    }

    private resetRun() {
      this.endTitle?.destroy(); this.endDetail?.destroy(); this.endTitle = undefined; this.endDetail = undefined; this.state = createMarketFloorState(); this.elapsedVisual = 0; this.statusElapsed = 0; this.draw();
      const minutes = Math.floor(MARKET_SESSION_SECONDS / 60); const seconds = MARKET_SESSION_SECONDS % 60;
      bridge.setStatus(`Trading floor open — ${minutes}m ${seconds}s session · WASD/arrows move · E interacts · Shift dashes`);
      bridge.emit("game_started", { mode: "trading-floor-arcade", session_seconds: MARKET_SESSION_SECONDS, best_score: bestScore });
    }

    private handleResize() {
      this.endTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 24); this.endDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 32); this.draw();
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [MarketMakerArcadeScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("market-maker-arcade"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("market-maker-arcade"); bridge.setStatus("Trading floor resumed"); },
    restart() { game.scene.stop("market-maker-arcade"); game.scene.start("market-maker-arcade"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { delete mount.dataset.marketArcade; delete mount.dataset.marketMode; delete mount.dataset.marketPlayerX; delete mount.dataset.marketPlayerY; delete mount.dataset.marketInventory; delete mount.dataset.marketCompleted; delete mount.dataset.marketCarried; delete mount.dataset.marketScore; delete mount.dataset.marketTime; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
