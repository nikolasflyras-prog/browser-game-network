import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { advanceSkybound, createSkyboundState, skyboundPlayerRadius, type SkyboundState } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0a1020;
const PLATFORM = 0x6be5b5;
const PLAYER = 0xf7fbff;
const ACCENT = 0x75a8ff;

export function mountGame(mount: HTMLElement, bridge: GameBridge): GameRuntimeController {
  let muted = false;
  let audioContext: AudioContext | null = null;
  let bestScore = readLocalGameValue<number>(bridge.gameSlug, "high-score", SAVE_VERSION) ?? 0;
  const tone = (frequency: number, duration = 0.05, volume = 0.025) => {
    if (muted || typeof window === "undefined") return;
    try {
      audioContext ??= new AudioContext(); const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
      osc.frequency.value = frequency; gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
    } catch { /* optional audio */ }
  };

  class SkyboundScene extends Phaser.Scene {
    private state!: SkyboundState;
    private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
    private platforms = new Map<number, Phaser.GameObjects.Rectangle>();
    private player?: Phaser.GameObjects.Arc;
    private scoreLabel?: Phaser.GameObjects.Text;
    private heightLabel?: Phaser.GameObjects.Text;
    private bestLabel?: Phaser.GameObjects.Text;
    private hintLabel?: Phaser.GameObjects.Text;
    private gameOverTitle?: Phaser.GameObjects.Text;
    private gameOverDetail?: Phaser.GameObjects.Text;
    private statusElapsed = 0;

    constructor() { super("skybound"); }
    create() {
      this.cameras.main.setBackgroundColor(BACKGROUND);
      this.player = this.add.circle(0, 0, skyboundPlayerRadius, PLAYER).setStrokeStyle(4, ACCENT, 0.85).setDepth(3);
      this.scoreLabel = this.add.text(22, 18, "Score 0", { color: "#f7fbff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", fontStyle: "bold" }).setDepth(5);
      this.heightLabel = this.add.text(22, 46, "Height 0m", { color: "#91a4c6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "14px", fontStyle: "bold" }).setDepth(5);
      this.bestLabel = this.add.text(this.scale.width - 22, 22, `Best ${bestScore}`, { color: "#91a4c6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", fontStyle: "bold" }).setOrigin(1, 0).setDepth(5);
      this.hintLabel = this.add.text(this.scale.width / 2, this.scale.height - 24, "STEER LEFT / RIGHT · LAND TO BOUNCE", { color: "#91a4c6", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5).setDepth(5);
      if (this.input.keyboard) this.keys = this.input.keyboard.addKeys("A,D,LEFT,RIGHT,R") as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard?.on("keydown-R", () => this.resetRun());
      this.scale.on("resize", this.handleResize, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", this.handleResize, this));
      this.resetRun();
    }
    update(_time: number, delta: number) {
      if (!this.state || this.state.mode === "gameover") return;
      let input = Number(Boolean(this.keys.D?.isDown || this.keys.RIGHT?.isDown)) - Number(Boolean(this.keys.A?.isDown || this.keys.LEFT?.isDown));
      const pointer = this.input.activePointer;
      if (pointer?.isDown) input = pointer.x < this.state.playerX ? -1 : 1;
      const result = advanceSkybound(this.state, input, delta / 1000, this.scale.width, this.scale.height);
      this.state = result.state; this.syncVisuals();
      if (result.event === "landed") { tone(520 + Math.min(200, this.state.landings * 8)); bridge.emit("game_action", { action: "landed", landings: this.state.landings, score: this.state.score, height: Math.round(this.state.heightClimbed) }); }
      else if (result.event === "game_over") this.endRun();
      this.statusElapsed += delta;
      if (this.statusElapsed >= 450 && this.state.mode !== "gameover") { this.statusElapsed = 0; bridge.setStatus(`Climbing · ${Math.round(this.state.heightClimbed / 10)}m · ${this.state.score} points`); }
    }
    private syncVisuals() {
      this.player?.setPosition(this.state.playerX, this.state.playerY);
      const live = new Set<number>();
      for (const platform of this.state.platforms) {
        live.add(platform.id); let view = this.platforms.get(platform.id);
        if (!view) { view = this.add.rectangle(platform.x + platform.width / 2, platform.y + 5, platform.width, 10, PLATFORM).setDepth(2); this.platforms.set(platform.id, view); }
        view.setPosition(platform.x + platform.width / 2, platform.y + 5).setSize(platform.width, 10).setDisplaySize(platform.width, 10);
      }
      for (const [id, view] of this.platforms) if (!live.has(id)) { view.destroy(); this.platforms.delete(id); }
      this.scoreLabel?.setText(`Score ${this.state.score}`); this.heightLabel?.setText(`Height ${Math.round(this.state.heightClimbed / 10)}m`); this.bestLabel?.setText(`Best ${bestScore}`);
      mount.dataset.skyX = this.state.playerX.toFixed(1); mount.dataset.skyHeight = this.state.heightClimbed.toFixed(1); mount.dataset.skyMode = this.state.mode;
    }
    private endRun() {
      bestScore = Math.max(bestScore, this.state.score); writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      bridge.emit("game_over", { score: this.state.score, height: Math.round(this.state.heightClimbed), landings: this.state.landings, best_score: bestScore });
      bridge.setStatus(`Fall ended — ${this.state.score} points · press R to climb again`); tone(110, 0.22, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "FALL", { color: "#f7fbff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "32px", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${Math.round(this.state.heightClimbed / 10)}m climbed · ${this.state.score} points\nPress R or Restart`, { color: "#91a4c6", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(7);
    }
    private resetRun() {
      this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined;
      for (const view of this.platforms.values()) view.destroy(); this.platforms.clear();
      this.state = createSkyboundState(this.scale.width, this.scale.height); this.statusElapsed = 0; this.syncVisuals();
      bridge.setStatus("Skybound live — steer left/right; every platform auto-bounces you upward"); bridge.emit("game_started", { mode: "endless-climb", best_score: bestScore });
    }
    private handleResize() { this.bestLabel?.setPosition(this.scale.width - 22, 22); this.hintLabel?.setPosition(this.scale.width / 2, this.scale.height - 24); this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 18); this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28); this.resetRun(); }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [SkyboundScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return { pause() { game.scene.pause("skybound"); bridge.setStatus("Paused"); }, resume() { game.scene.resume("skybound"); bridge.setStatus("Skybound resumed"); }, restart() { game.scene.stop("skybound"); game.scene.start("skybound"); }, setMuted(nextMuted: boolean) { muted = nextMuted; }, destroy() { delete mount.dataset.skyX; delete mount.dataset.skyHeight; delete mount.dataset.skyMode; game.destroy(true); void audioContext?.close(); audioContext = null; } } satisfies GameRuntimeController;
}
