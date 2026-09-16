import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { MARKET_SESSION_SECONDS, MARKET_WORLD, advanceMarketFloor, createMarketFloorState, interactMarketFloor, marketFloorLayout, marketFloorPnl, marketFloorPrompt, marketFloorQuote, scoreMarketFloor, type MarketFloorEvent, type MarketFloorState } from "./model";

const SAVE_VERSION = 2;
const BACKGROUND = 0x071012;
const FLOOR = 0x0c1b1e;
const GRID = 0x173238;
const DESK_TOP = 0x20373b;
const DESK_SIDE = 0x12262a;
const PLAYER = 0xf5fbf7;
const SHADOW = 0x020607;
const BUY = 0x63d7ff;
const SELL = 0xff9b67;
const HEDGE = 0xb794f6;
const VENUE_COLORS = { alpha: 0x64e6b5, beta: 0xffd166, gamma: 0xff7185 } as const;

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
    private statusElapsed = 0;
    private elapsedVisual = 0;

    constructor() { super("market-maker-arcade"); }

    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.graphics = this.add.graphics();
      this.pnlLabel = this.add.text(18, 14, "P&L $0.00", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "18px", fontStyle: "bold" }).setDepth(8);
      this.marketLabel = this.add.text(this.scale.width / 2, 15, "FAIR 100.00", { color: "#a7c0c4", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(8);
      this.timeLabel = this.add.text(this.scale.width - 18, 14, "3:30", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "18px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(8);
      this.bestLabel = this.add.text(this.scale.width - 18, 40, `Best ${bestScore}`, { color: "#78949a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(8);
      this.promptLabel = this.add.text(this.scale.width / 2, this.scale.height - 20, "MOVE · FIND CLIENT FLOW", { color: "#f5fbf7", backgroundColor: "#071012dd", padding: { x: 10, y: 6 }, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(0.5, 1).setDepth(9);
      this.shockLabel = this.add.text(this.scale.width / 2, 48, "", { color: "#ff7185", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(9).setAlpha(0);
      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 150 && pointer.y >= this.scale.height - 88) this.interact();
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
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 150 && pointer.y >= this.scale.height - 88)) {
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

    private viewport() {
      const scale = Math.min(this.scale.width / MARKET_WORLD.width, this.scale.height / MARKET_WORLD.height);
      return { scale, ox: (this.scale.width - MARKET_WORLD.width * scale) / 2, oy: (this.scale.height - MARKET_WORLD.height * scale) / 2 };
    }

    private pointerToWorld(x: number, y: number) {
      const view = this.viewport();
      return { x: (x - view.ox) / view.scale, y: (y - view.oy) / view.scale };
    }

    private drawDesk(x: number, y: number, width: number, height: number) {
      const graphics = this.graphics; if (!graphics) return;
      const view = this.viewport();
      const sx = view.ox + x * view.scale; const sy = view.oy + y * view.scale; const sw = width * view.scale; const sh = height * view.scale; const depth = Math.max(4, 9 * view.scale);
      graphics.fillStyle(SHADOW, 0.5); graphics.fillRoundedRect(sx + depth, sy + depth, sw, sh, 7 * view.scale);
      graphics.fillStyle(DESK_SIDE, 1); graphics.fillRoundedRect(sx + depth * 0.5, sy + depth * 0.55, sw, sh, 7 * view.scale);
      graphics.fillStyle(DESK_TOP, 1); graphics.fillRoundedRect(sx, sy, sw, sh, 7 * view.scale);
      graphics.lineStyle(Math.max(1, view.scale), GRID, 0.9); graphics.strokeRoundedRect(sx, sy, sw, sh, 7 * view.scale);
    }

    private draw() {
      const graphics = this.graphics; if (!graphics) return;
      graphics.clear();
      const view = this.viewport();
      graphics.fillStyle(BACKGROUND, 1); graphics.fillRect(0, 0, this.scale.width, this.scale.height);
      graphics.fillStyle(FLOOR, 1); graphics.fillRoundedRect(view.ox, view.oy, MARKET_WORLD.width * view.scale, MARKET_WORLD.height * view.scale, 10 * view.scale);
      graphics.lineStyle(Math.max(1, view.scale), GRID, 0.42);
      for (let wx = 0; wx <= MARKET_WORLD.width; wx += 100) { const sx = view.ox + wx * view.scale; graphics.lineBetween(sx, view.oy, sx, view.oy + MARKET_WORLD.height * view.scale); }
      for (let wy = 0; wy <= MARKET_WORLD.height; wy += 80) { const sy = view.oy + wy * view.scale; graphics.lineBetween(view.ox, sy, view.ox + MARKET_WORLD.width * view.scale, sy); }
      for (const rect of marketFloorLayout.obstacles) this.drawDesk(rect.x, rect.y, rect.width, rect.height);

      for (const venue of marketFloorLayout.venues) {
        const sx = view.ox + venue.x * view.scale; const sy = view.oy + venue.y * view.scale; const color = VENUE_COLORS[venue.id];
        graphics.fillStyle(color, 0.12); graphics.fillCircle(sx, sy, 43 * view.scale); graphics.lineStyle(Math.max(2, 3 * view.scale), color, 0.95); graphics.strokeCircle(sx, sy, 43 * view.scale);
        const quote = marketFloorQuote(this.state, venue.id); const margin = (quote.ask - quote.bid).toFixed(2);
        graphics.fillStyle(color, 0.8); graphics.fillRect(sx - 25 * view.scale, sy - 3 * view.scale, 50 * view.scale, 6 * view.scale);
        void margin;
      }

      const hx = view.ox + marketFloorLayout.hedge.x * view.scale; const hy = view.oy + marketFloorLayout.hedge.y * view.scale;
      graphics.fillStyle(HEDGE, 0.12); graphics.fillCircle(hx, hy, 40 * view.scale); graphics.lineStyle(Math.max(2, 3 * view.scale), HEDGE, 0.95); graphics.strokeCircle(hx, hy, 40 * view.scale);

      for (const order of this.state.orders) {
        const ox = view.ox + order.x * view.scale; const oy = view.oy + order.y * view.scale; const color = order.side === "buy" ? BUY : SELL;
        const pulse = 1 + Math.sin((this.elapsedVisual + order.id * 310) / 180) * 0.08;
        graphics.fillStyle(color, 0.16); graphics.fillCircle(ox, oy, 26 * view.scale * pulse); graphics.lineStyle(Math.max(2, 3 * view.scale), color, 1); graphics.strokeCircle(ox, oy, 17 * view.scale);
        graphics.fillStyle(color, 1); graphics.fillRoundedRect(ox - 7 * view.scale, oy - 7 * view.scale, 14 * view.scale, 14 * view.scale, 3 * view.scale);
      }

      const px = view.ox + this.state.playerX * view.scale; const py = view.oy + this.state.playerY * view.scale; const moving = Math.hypot(this.state.vx, this.state.vy) > 30; const bob = moving ? Math.sin(this.elapsedVisual / 75) * 2.2 * view.scale : 0;
      graphics.fillStyle(SHADOW, 0.58); graphics.fillEllipse(px + 3 * view.scale, py + 13 * view.scale, 30 * view.scale, 12 * view.scale);
      graphics.fillStyle(PLAYER, 1); graphics.fillRoundedRect(px - 10 * view.scale, py - 10 * view.scale + bob, 20 * view.scale, 27 * view.scale, 7 * view.scale); graphics.fillCircle(px, py - 15 * view.scale + bob, 9 * view.scale);
      graphics.fillStyle(0x2c4a52, 1); graphics.fillRect(px - 2 * view.scale, py - 6 * view.scale + bob, 4 * view.scale, 15 * view.scale);
      if (this.state.carried) {
        const color = this.state.carried.side === "buy" ? BUY : SELL; graphics.fillStyle(color, 1); graphics.fillCircle(px + 17 * view.scale, py - 18 * view.scale + bob, 7 * view.scale); graphics.lineStyle(2 * view.scale, color, 0.8); graphics.strokeCircle(px + 17 * view.scale, py - 18 * view.scale + bob, 11 * view.scale);
      }

      const prompt = marketFloorPrompt(this.state);
      this.promptLabel?.setText(`E / SPACE · ${prompt}`);
      this.pnlLabel?.setText(`P&L $${marketFloorPnl(this.state).toFixed(2)} · Inv ${this.state.inventory} · Rep ${Math.round(this.state.reputation)}`);
      this.marketLabel?.setText(`FAIR ${this.state.fairValue.toFixed(2)} · Clients ${this.state.completed} · Risk ${this.state.riskCost.toFixed(1)}`);
      const seconds = Math.ceil(this.state.timeLeft); this.timeLabel?.setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
      this.bestLabel?.setText(`Best ${bestScore} · Dash ${Math.round(this.state.dashEnergy)}%`);
      this.shockLabel?.setText(this.state.shockLabel ?? "").setAlpha(this.state.shockLabel ? 1 : 0);

      graphics.fillStyle(0x0b1518, 0.92); graphics.fillRoundedRect(this.scale.width - 142, this.scale.height - 76, 124, 52, 9); graphics.lineStyle(2, 0x56747b, 0.9); graphics.strokeRoundedRect(this.scale.width - 142, this.scale.height - 76, 124, 52, 9); graphics.fillStyle(PLAYER, 0.9); graphics.fillRect(this.scale.width - 119, this.scale.height - 52, 78, 4);

      mount.dataset.marketArcade = "true";
      mount.dataset.marketMode = this.state.mode;
      mount.dataset.marketPlayerX = this.state.playerX.toFixed(1);
      mount.dataset.marketPlayerY = this.state.playerY.toFixed(1);
      mount.dataset.marketInventory = String(this.state.inventory);
      mount.dataset.marketCompleted = String(this.state.completed);
      mount.dataset.marketCarried = this.state.carried ? String(this.state.carried.id) : "";
      mount.dataset.marketScore = String(scoreMarketFloor(this.state));
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
      this.endTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 24, closingBell ? "CLOSING BELL" : "DESK LOST", { color: "#f5fbf7", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", fontStyle: "bold" }).setOrigin(0.5).setDepth(12);
      this.endDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${this.state.completed} clients · P&L $${marketFloorPnl(this.state).toFixed(2)} · Inventory ${this.state.inventory}\nScore ${score} · Press R or Restart`, { color: "#9db3b7", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(12);
      tone(closingBell ? 620 : 110, 0.22, 0.055);
    }

    private resetRun() {
      this.endTitle?.destroy(); this.endDetail?.destroy(); this.endTitle = undefined; this.endDetail = undefined; this.state = createMarketFloorState(); this.elapsedVisual = 0; this.statusElapsed = 0; this.draw();
      bridge.setStatus(`Trading floor open — ${MARKET_SESSION_SECONDS / 60}m ${MARKET_SESSION_SECONDS % 60}s session · move with WASD/arrows · E interacts · Shift dashes`);
      bridge.emit("game_started", { mode: "trading-floor-arcade", session_seconds: MARKET_SESSION_SECONDS, best_score: bestScore });
    }

    private handleResize() {
      this.marketLabel?.setPosition(this.scale.width / 2, 15); this.timeLabel?.setPosition(this.scale.width - 18, 14); this.bestLabel?.setPosition(this.scale.width - 18, 40); this.promptLabel?.setPosition(this.scale.width / 2, this.scale.height - 20); this.shockLabel?.setPosition(this.scale.width / 2, 48); this.endTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 24); this.endDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28); this.draw();
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [MarketMakerArcadeScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return {
    pause() { game.scene.pause("market-maker-arcade"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("market-maker-arcade"); bridge.setStatus("Trading floor resumed"); },
    restart() { game.scene.stop("market-maker-arcade"); game.scene.start("market-maker-arcade"); },
    setMuted(nextMuted: boolean) { muted = nextMuted; },
    destroy() { delete mount.dataset.marketArcade; delete mount.dataset.marketMode; delete mount.dataset.marketPlayerX; delete mount.dataset.marketPlayerY; delete mount.dataset.marketInventory; delete mount.dataset.marketCompleted; delete mount.dataset.marketCarried; delete mount.dataset.marketScore; game.destroy(true); void audioContext?.close(); audioContext = null; },
  } satisfies GameRuntimeController;
}
