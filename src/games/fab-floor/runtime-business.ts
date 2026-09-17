import Phaser from "phaser";
import { boundedWorldCamera } from "@/games/_shared/camera/worldCamera";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import {
  FAB_FLOOR_WORLD,
  advanceFabFloor,
  createFabFloorState,
  fabFloorLayout,
  fabFloorPrompt,
  fabFloorYield,
  interactFabFloor,
  type FabFloorEvent,
  type FabFloorState,
  type FabToolId,
} from "./model";
import {
  activeFabContract,
  advanceFabBusiness,
  createFabBusinessState,
  fabBusinessLayout,
  fabBusinessPrompt,
  fabBusinessScore,
  fabContractYield,
  fabNodeProgram,
  interactFabBusiness,
  type FabBusinessEvent,
  type FabBusinessState,
} from "./business";

const BG = 0x071013;
const FLOOR = 0x102126;
const GRID = 0x1f3b40;
const INK = 0xeaf5f3;
const GREEN = 0x64e3b4;
const YELLOW = 0xffce66;
const RED = 0xff6f7f;
const CYAN = 0x68d9ee;
const CAPEX = 0xd8a7ff;
const OPS = 0x7fb2ff;
const TOOL_COLORS: Record<FabToolId, number> = { lithography: 0xd59cff, etch: 0x70d7ff, metrology: 0x6be0ad };

function clock(seconds: number) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audio: AudioContext | null = null;
  let best = readLocalGameValue<number>(bridge.gameSlug, "high-score", 2) ?? 0;

  const tone = (frequency: number, duration = 0.07) => {
    if (muted || typeof window === "undefined") return;
    try {
      audio ??= new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.stop(audio.currentTime + duration);
    } catch {
      // Audio is optional.
    }
  };

  class FabBusinessScene extends Phaser.Scene {
    private state!: FabFloorState;
    private business!: FabBusinessState;
    private graphics?: Phaser.GameObjects.Graphics;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private left?: Phaser.GameObjects.Text;
    private right?: Phaser.GameObjects.Text;
    private contractPanel?: Phaser.GameObjects.Text;
    private prompt?: Phaser.GameObjects.Text;
    private detail?: Phaser.GameObjects.Text;
    private notice?: Phaser.GameObjects.Text;
    private touchInteract?: Phaser.GameObjects.Text;
    private capexLabel?: Phaser.GameObjects.Text;
    private opsLabel?: Phaser.GameObjects.Text;

    constructor() {
      super("fab-floor-business");
    }

    create() {
      this.graphics = this.add.graphics();
      this.left = this.add.text(14, 12, "", {
        color: "#eaf5f3", fontFamily: "Arial", fontSize: "13px", fontStyle: "bold",
        backgroundColor: "#071013df", padding: { x: 8, y: 5 },
      }).setDepth(30);
      this.right = this.add.text(this.scale.width - 14, 12, "", {
        color: "#eaf5f3", fontFamily: "Arial", fontSize: "13px", fontStyle: "bold", align: "right",
        backgroundColor: "#071013df", padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30);
      this.contractPanel = this.add.text(this.scale.width / 2, 12, "", {
        color: "#d9eef0", fontFamily: "Arial", fontSize: "10px", fontStyle: "bold", align: "center",
        backgroundColor: "#0a181ceF", padding: { x: 9, y: 5 }, wordWrap: { width: 520 },
      }).setOrigin(0.5, 0).setDepth(31);
      this.prompt = this.add.text(this.scale.width / 2, this.scale.height - 12, "", {
        color: "#eaf5f3", fontFamily: "Arial", fontSize: "11px", fontStyle: "bold", align: "center",
        backgroundColor: "#071013ef", padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 1).setDepth(31);
      this.detail = this.add.text(14, this.scale.height - 12, "", {
        color: "#9bb0ad", fontFamily: "Arial", fontSize: "10px",
        backgroundColor: "#071013e8", padding: { x: 7, y: 5 },
      }).setOrigin(0, 1).setDepth(31);
      this.notice = this.add.text(this.scale.width / 2, 78, "", {
        color: "#ffdf8a", fontFamily: "Arial", fontSize: "11px", fontStyle: "bold", align: "center",
        backgroundColor: "#071013f2", padding: { x: 8, y: 5 },
      }).setOrigin(0.5, 0).setDepth(32).setAlpha(0);
      this.touchInteract = this.add.text(this.scale.width - 64, this.scale.height - 46, "INTERACT", {
        color: "#64e3b4", fontFamily: "Arial", fontSize: "11px", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(33);
      this.capexLabel = this.add.text(0, 0, "CAPEX\nUPGRADE FOCUS TOOL", {
        color: "#d8a7ff", fontFamily: "Arial", fontSize: "9px", fontStyle: "bold", align: "center",
      }).setOrigin(0.5).setDepth(18);
      this.opsLabel = this.add.text(0, 0, "OPERATIONS\nHIRE EQUIPMENT TECH", {
        color: "#7fb2ff", fontFamily: "Arial", fontSize: "9px", fontStyle: "bold", align: "center",
      }).setOrigin(0.5).setDepth(18);

      if (this.input.keyboard) {
        this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R") as Record<string, Phaser.Input.Keyboard.Key>;
      }
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-R", () => this.reset());
      this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (pointer.x >= this.scale.width - 136 && pointer.y >= this.scale.height - 86) this.interact();
      });
      this.scale.on("resize", this.resize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.resize, this));
      this.reset();
    }

    update(_time: number, delta: number) {
      if (this.state.mode !== "playing") return;
      let x = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      let y = Number(Boolean(this.keys.S?.isDown || this.keys.DOWN?.isDown)) - Number(Boolean(this.keys.W?.isDown || this.keys.UP?.isDown));
      const pointer = this.input.activePointer;
      if (pointer?.isDown && !(pointer.x >= this.scale.width - 136 && pointer.y >= this.scale.height - 86)) {
        const world = this.screenToWorld(pointer.x, pointer.y);
        const dx = world.x - this.state.playerX;
        const dy = world.y - this.state.playerY;
        const distance = Math.hypot(dx, dy);
        if (distance > 20) {
          x = dx / distance;
          y = dy / distance;
        }
      }

      const dt = delta / 1000;
      const before = this.state;
      const floorResult = advanceFabFloor(this.state, { x, y }, dt);
      const businessResult = advanceFabBusiness(before, floorResult.state, this.business, dt);
      this.state = businessResult.core;
      this.business = businessResult.business;
      this.floorEvent(floorResult.event);
      this.businessEvent(businessResult.event);
      this.draw();
    }

    private projection() {
      const mobile = this.scale.width < 620;
      if (!mobile) {
        return {
          cameraX: FAB_FLOOR_WORLD.width / 2,
          cameraY: FAB_FLOOR_WORLD.height / 2,
          anchorX: this.scale.width / 2,
          anchorY: this.scale.height / 2 + 12,
          scale: Math.min((this.scale.width - 42) / FAB_FLOOR_WORLD.width, (this.scale.height - 106) / FAB_FLOOR_WORLD.height),
        };
      }
      const scale = Math.max(0.58, Math.min(0.76, this.scale.width / 520));
      return boundedWorldCamera({
        playerX: this.state.playerX,
        playerY: this.state.playerY,
        viewportWidth: this.scale.width,
        viewportHeight: this.scale.height,
        worldWidth: FAB_FLOOR_WORLD.width,
        worldHeight: FAB_FLOOR_WORLD.height,
        scale,
        anchorY: this.scale.height * 0.56,
      });
    }

    private project(x: number, y: number) {
      const camera = this.projection();
      return {
        x: camera.anchorX + (x - camera.cameraX) * camera.scale,
        y: camera.anchorY + (y - camera.cameraY) * camera.scale,
      };
    }

    private screenToWorld(x: number, y: number) {
      const camera = this.projection();
      return {
        x: camera.cameraX + (x - camera.anchorX) / camera.scale,
        y: camera.cameraY + (y - camera.anchorY) / camera.scale,
      };
    }

    private draw() {
      const graphics = this.graphics;
      if (!graphics) return;
      graphics.clear();
      graphics.fillStyle(BG, 1).fillRect(0, 0, this.scale.width, this.scale.height);
      const worldA = this.project(0, 0);
      const worldB = this.project(FAB_FLOOR_WORLD.width, FAB_FLOOR_WORLD.height);
      const camera = this.projection();
      graphics.fillStyle(FLOOR, 1).fillRect(worldA.x, worldA.y, worldB.x - worldA.x, worldB.y - worldA.y);
      graphics.lineStyle(Math.max(0.6, camera.scale), GRID, 0.45);
      for (let x = 0; x <= FAB_FLOOR_WORLD.width; x += 80) {
        const top = this.project(x, 0);
        const bottom = this.project(x, FAB_FLOOR_WORLD.height);
        graphics.lineBetween(top.x, top.y, bottom.x, bottom.y);
      }
      for (let y = 0; y <= FAB_FLOOR_WORLD.height; y += 80) {
        const left = this.project(0, y);
        const right = this.project(FAB_FLOOR_WORLD.width, y);
        graphics.lineBetween(left.x, left.y, right.x, right.y);
      }

      this.drawRelease();
      this.drawTools();
      this.drawLots();
      this.drawMaintenance();
      this.drawBusinessStations();
      this.drawPlayer();

      const queue: Record<FabToolId, number> = { lithography: 0, etch: 0, metrology: 0 };
      for (const lot of this.state.lots) queue[lot.stage] += 1;
      const contract = activeFabContract(this.business);
      const contractYield = fabContractYield(this.business);
      const node = fabNodeProgram(this.business);
      const mobile = this.scale.width < 620;

      this.left?.setText(
        mobile
          ? `WIP ${this.state.lots.length} · Yield ${(fabFloorYield(this.state) * 100).toFixed(1)}%\nGood ${Math.round(this.state.goodDie)}`
          : `WIP ${this.state.lots.length} · L${queue.lithography} E${queue.etch} M${queue.metrology}\nGood die ${Math.round(this.state.goodDie)} · Yield ${(fabFloorYield(this.state) * 100).toFixed(1)}%`,
      );
      this.right?.setText(
        mobile
          ? `${clock(this.state.timeLeft)} · Rep ${Math.round(this.state.reputation)}\nCash ${this.state.cash.toFixed(0)}`
          : `${clock(this.state.timeLeft)} SHIFT\nRep ${Math.round(this.state.reputation)} · Cash ${this.state.cash.toFixed(0)} · Best ${best}`,
      );
      this.contractPanel?.setText(
        mobile
          ? `${node.label} · ${contract.label}\n${this.business.contractLots}/${contract.requiredLots} lots · Y ${(contractYield * 100).toFixed(1)} / ${(contract.minYield * 100).toFixed(1)}% · ${Math.ceil(this.business.contractTimeLeft)}s`
          : `${node.label} · ${contract.customer} — ${contract.label}\nORDER ${this.business.contractLots}/${contract.requiredLots} lots · contract yield ${(contractYield * 100).toFixed(1)}% / target ${(contract.minYield * 100).toFixed(1)}% · ${Math.ceil(this.business.contractTimeLeft)}s · reward ${contract.reward}`,
      );
      const businessPrompt = fabBusinessPrompt(this.state, this.business);
      this.prompt?.setText(`${businessPrompt || fabFloorPrompt(this.state)} · WASD/ARROWS + E`);
      this.detail?.setText(
        `FOCUS ${this.state.focus.toUpperCase()}${this.state.carryingKit ? " · KIT" : ""} · TECHS ${this.business.technicians}/3\nCAPEX L${this.business.upgrades.lithography} E${this.business.upgrades.etch} M${this.business.upgrades.metrology} · CONTRACTS ${this.business.contractsWon}W/${this.business.contractsMissed}M · SCORE ${fabBusinessScore(this.state, this.business)}`,
      );
      this.notice?.setText(this.business.notice).setAlpha(this.business.noticeTimer > 0 ? 1 : 0);
      this.touchInteract?.setVisible(mobile);

      mount.dataset.fabX = this.state.playerX.toFixed(1);
      mount.dataset.fabY = this.state.playerY.toFixed(1);
      mount.dataset.fabLots = String(this.state.lots.length);
      mount.dataset.fabCompleted = String(this.state.completedLots);
      mount.dataset.fabFocus = this.state.focus;
      mount.dataset.fabKit = this.state.carryingKit ? "true" : "false";
      mount.dataset.fabMode = this.state.mode;
      mount.dataset.fabAlarms = String(Object.values(this.state.tools).filter((tool) => tool.alarm).length);
      mount.dataset.fabContract = contract.id;
      mount.dataset.fabContractLots = String(this.business.contractLots);
      mount.dataset.fabContractsWon = String(this.business.contractsWon);
      mount.dataset.fabContractsMissed = String(this.business.contractsMissed);
      mount.dataset.fabNode = node.id;
      mount.dataset.fabTechnicians = String(this.business.technicians);
      mount.dataset.fabUpgradeLithography = String(this.business.upgrades.lithography);
      mount.dataset.fabUpgradeEtch = String(this.business.upgrades.etch);
      mount.dataset.fabUpgradeMetrology = String(this.business.upgrades.metrology);
    }

    private drawRelease() {
      const point = this.project(fabFloorLayout.release.x, fabFloorLayout.release.y);
      const scale = this.projection().scale;
      this.graphics?.fillStyle(YELLOW, 0.14).fillCircle(point.x, point.y, 42 * scale);
      this.graphics?.lineStyle(2, YELLOW, 0.85).strokeCircle(point.x, point.y, 42 * scale);
    }

    private drawTools() {
      for (const id of ["lithography", "etch", "metrology"] as FabToolId[]) {
        const rect = fabFloorLayout.tools[id];
        const topLeft = this.project(rect.x, rect.y);
        const bottomRight = this.project(rect.x + rect.width, rect.y + rect.height);
        const tool = this.state.tools[id];
        const color = tool.alarm ? RED : TOOL_COLORS[id];
        this.graphics?.fillStyle(0x173139, 1).fillRoundedRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y, 8);
        this.graphics?.lineStyle(tool.alarm ? 4 : 2, color, 0.9).strokeRoundedRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y, 8);
        const center = this.project(rect.x + rect.width / 2, rect.y + rect.height / 2);
        this.graphics?.fillStyle(color, 0.16).fillCircle(center.x, center.y, 45 * this.projection().scale);
        if (this.state.focus === id) this.graphics?.lineStyle(3, YELLOW, 0.7).strokeCircle(center.x, center.y, 58 * this.projection().scale);
        const level = this.business.upgrades[id];
        if (level > 0) this.graphics?.lineStyle(2 + level, CAPEX, 0.55).strokeRoundedRect(topLeft.x + 4, topLeft.y + 4, bottomRight.x - topLeft.x - 8, bottomRight.y - topLeft.y - 8, 6);
      }
    }

    private drawLots() {
      const counts: Record<FabToolId, number> = { lithography: 0, etch: 0, metrology: 0 };
      for (const lot of this.state.lots) {
        const rect = fabFloorLayout.tools[lot.stage];
        const index = counts[lot.stage]++;
        const base = this.project(rect.x - 42 + (index % 4) * 22, rect.y + rect.height + 34 + Math.floor(index / 4) * 18);
        const scale = this.projection().scale;
        this.graphics?.fillStyle(CYAN, 0.95).fillRoundedRect(base.x - 9 * scale, base.y - 5 * scale, 18 * scale, 10 * scale, 2);
      }
    }

    private drawMaintenance() {
      const point = this.project(fabFloorLayout.maintenance.x, fabFloorLayout.maintenance.y);
      const scale = this.projection().scale;
      this.graphics?.fillStyle(GREEN, 0.12).fillCircle(point.x, point.y, 43 * scale);
      this.graphics?.lineStyle(2, GREEN, 0.8).strokeCircle(point.x, point.y, 43 * scale);
    }

    private drawBusinessStations() {
      const scale = this.projection().scale;
      const capex = this.project(fabBusinessLayout.capex.x, fabBusinessLayout.capex.y);
      const ops = this.project(fabBusinessLayout.operations.x, fabBusinessLayout.operations.y);
      this.graphics?.fillStyle(CAPEX, 0.14).fillCircle(capex.x, capex.y, 45 * scale);
      this.graphics?.lineStyle(2, CAPEX, 0.9).strokeCircle(capex.x, capex.y, 45 * scale);
      this.graphics?.fillStyle(OPS, 0.14).fillCircle(ops.x, ops.y, 45 * scale);
      this.graphics?.lineStyle(2, OPS, 0.9).strokeCircle(ops.x, ops.y, 45 * scale);
      this.capexLabel?.setPosition(capex.x, capex.y + 62 * scale);
      this.opsLabel?.setPosition(ops.x, ops.y + 62 * scale);
    }

    private drawPlayer() {
      const point = this.project(this.state.playerX, this.state.playerY);
      const scale = this.projection().scale;
      this.graphics?.fillStyle(0x020405, 0.5).fillEllipse(point.x + 2 * scale, point.y + 11 * scale, 22 * scale, 8 * scale);
      this.graphics?.fillStyle(INK, 1).fillCircle(point.x, point.y - 2 * scale, 11 * scale);
      if (this.state.carryingKit) this.graphics?.fillStyle(YELLOW, 1).fillRect(point.x + 9 * scale, point.y - 14 * scale, 11 * scale, 9 * scale);
    }

    private interact() {
      const businessResult = interactFabBusiness(this.state, this.business);
      if (businessResult.event !== "none") {
        this.state = businessResult.core;
        this.business = businessResult.business;
        this.businessEvent(businessResult.event);
        this.draw();
        return;
      }
      const floorResult = interactFabFloor(this.state);
      this.state = floorResult.state;
      this.floorEvent(floorResult.event);
      this.draw();
    }

    private floorEvent(event: FabFloorEvent) {
      if (event === "lot_released") {
        tone(520);
        bridge.emit("game_action", { action: "lot_released", wip: this.state.lots.length, node: fabNodeProgram(this.business).id });
      } else if (event === "kit_picked") {
        tone(650);
      } else if (event === "maintenance_started") {
        tone(760);
        bridge.emit("game_action", { action: "maintenance_started" });
      } else if (event === "focus_changed") {
        tone(580);
      } else if (event === "alarm") {
        tone(165, 0.14);
        bridge.setStatus("Tool alarm — get a maintenance kit and reach the flashing tool");
      } else if (event === "lot_completed") {
        tone(820);
      } else if (event === "shift_complete") {
        this.end();
      }
    }

    private businessEvent(event: FabBusinessEvent) {
      if (event === "none") return;
      if (event === "capex_upgrade") {
        tone(690);
        bridge.emit("game_action", { action: "fab_capex_upgrade", focus: this.state.focus, level: this.business.upgrades[this.state.focus] });
      } else if (event === "technician_hired") {
        tone(610);
        bridge.emit("game_action", { action: "fab_technician_hired", technicians: this.business.technicians });
      } else if (event === "contract_won") {
        tone(910, 0.12);
        bridge.emit("game_action", { action: "fab_contract_won", contracts_won: this.business.contractsWon, node: fabNodeProgram(this.business).id });
      } else if (event === "node_advanced") {
        tone(1040, 0.16);
        bridge.emit("game_action", { action: "fab_node_advanced", contracts_won: this.business.contractsWon, node: fabNodeProgram(this.business).id });
      } else if (event === "contract_missed") {
        tone(190, 0.14);
        bridge.emit("game_action", { action: "fab_contract_missed", contracts_missed: this.business.contractsMissed });
      }
    }

    private end() {
      const score = fabBusinessScore(this.state, this.business);
      best = Math.max(best, score);
      writeLocalGameValue(bridge.gameSlug, "high-score", 2, best);
      bridge.emit("game_over", {
        score,
        good_die: this.state.goodDie,
        yield: fabFloorYield(this.state),
        completed_lots: this.state.completedLots,
        contracts_won: this.business.contractsWon,
        contracts_missed: this.business.contractsMissed,
        node: fabNodeProgram(this.business).id,
        technicians: this.business.technicians,
      });
      bridge.setStatus(`Fab campaign complete · ${this.business.contractsWon} contracts won · ${fabNodeProgram(this.business).label} · score ${score}`);
    }

    private reset() {
      this.state = createFabFloorState((Date.now() ^ 0x51f15e) >>> 0);
      this.business = createFabBusinessState();
      this.draw();
      bridge.setStatus("Fab Floor v2 live — run WIP, win customer orders, invest in tools, and advance the process node");
      bridge.emit("game_started", { mode: "walkable-fab-business", node: fabNodeProgram(this.business).id });
    }

    private resize() {
      this.right?.setPosition(this.scale.width - 14, 12);
      this.contractPanel?.setPosition(this.scale.width / 2, 12);
      this.prompt?.setPosition(this.scale.width / 2, this.scale.height - 12);
      this.detail?.setPosition(14, this.scale.height - 12);
      this.notice?.setPosition(this.scale.width / 2, 78);
      this.touchInteract?.setPosition(this.scale.width - 64, this.scale.height - 46);
      this.draw();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    backgroundColor: BG,
    scene: [FabBusinessScene],
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    render: { antialias: true, pixelArt: false },
  });

  return {
    pause() { game.scene.pause("fab-floor-business"); bridge.setStatus("Paused"); },
    resume() { game.scene.resume("fab-floor-business"); bridge.setStatus("Fab Floor resumed"); },
    restart() { game.scene.stop("fab-floor-business"); game.scene.start("fab-floor-business"); },
    setMuted(value: boolean) { muted = value; },
    destroy() { game.destroy(true); void audio?.close(); audio = null; },
  } satisfies GameRuntimeController;
}
