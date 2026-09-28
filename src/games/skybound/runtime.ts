import Phaser from "phaser";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { advanceSkybound, createSkyboundState, skyboundPlayerRadius, type SkyboundState } from "./model";

const SAVE_VERSION = 1;
const BACKGROUND = 0x0a1020;
const PLATFORM = 0x6be5b5;
const PLAYER = 0xf7fbff;
const ACCENT = 0x75a8ff;
const BOOST = 0xffcf66;
const FRAGILE = 0xff7f9f;
const SKY_TIERS = ["ROOFTOPS", "CLOUDLINE", "STRATOSPHERE", "ORBITAL ASCENT"] as const;
function skyTier(score: number) { return score >= 7000 ? 3 : score >= 3800 ? 2 : score >= 1600 ? 1 : 0; }

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
    private skyGraphics?: Phaser.GameObjects.Graphics;
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
      this.skyGraphics = this.add.graphics().setDepth(0);
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
      if (result.event === "landed") { const kind = this.state.lastLandingKind ?? "normal"; tone(kind === "boost" ? 760 : kind === "fragile" ? 430 : 520 + Math.min(200, this.state.landings * 8)); bridge.emit("game_action", { action: "landed", kind, landings: this.state.landings, score: this.state.score, height: Math.round(this.state.heightClimbed) }); if (kind === "boost") bridge.setStatus("Boost platform — super bounce engaged"); else if (kind === "fragile") bridge.setStatus("Fragile platform collapsed behind you"); }
      else if (result.event === "game_over") this.endRun();
      this.statusElapsed += delta;
      if (this.statusElapsed >= 450 && this.state.mode !== "gameover") { this.statusElapsed = 0; bridge.setStatus(`Climbing · ${Math.round(this.state.heightClimbed / 10)}m · ${this.state.score} points`); }
    }
    private drawSky() {
      const g = this.skyGraphics; if (!g) return; g.clear();
      const altitude = this.state?.heightClimbed ?? 0; const tier = skyTier(bestScore);
      const band = altitude > 5200 ? 3 : altitude > 2600 ? 2 : altitude > 900 ? 1 : 0;
      const fills = [0x0a1020,0x0c1730,0x101a35,0x070b18]; g.fillStyle(fills[band],1).fillRect(0,0,this.scale.width,this.scale.height);
      const starCount = 10 + band * 12 + tier * 5;
      for (let i=0;i<starCount;i++) { const x = (i * 83 + 37) % Math.max(1,this.scale.width); const y = (i * 47 + 19) % Math.max(1,this.scale.height * 0.72); g.fillStyle(0xd8e5ff,0.16 + (i%4)*0.08).fillCircle(x,y,1 + (i%3)*0.45); }
      if (band === 0) { const base = this.scale.height - 58; for (let x=0;x<this.scale.width;x+=72){const h=24+((x/72)%4)*13;g.fillStyle(0x111a29,.82).fillRect(x,base-h,58,h);} }
      if (band === 1) { for(let i=0;i<5;i++){const x=(i*170+40)%this.scale.width,y=90+i*63;g.fillStyle(0xd9ecff,.06).fillEllipse(x,y,120,34);} }
      if (band >= 2) { const horizon=this.scale.height*.72; g.fillStyle(0x4b73b8,.12).fillEllipse(this.scale.width/2,horizon+120,this.scale.width*1.35,260); }
      if (band === 3) { g.lineStyle(2,ACCENT,.18).strokeCircle(this.scale.width*.76,this.scale.height*.23,42+tier*5); }
    }

    private syncVisuals() {
      this.drawSky();
      this.player?.setPosition(this.state.playerX, this.state.playerY);
      const live = new Set<number>();
      for (const platform of this.state.platforms) {
        live.add(platform.id); let view = this.platforms.get(platform.id);
        const color = platform.kind === "boost" ? BOOST : platform.kind === "fragile" ? FRAGILE : PLATFORM;
        if (!view) { view = this.add.rectangle(platform.x + platform.width / 2, platform.y + 5, platform.width, 10, color).setDepth(2); this.platforms.set(platform.id, view); }
        view.setPosition(platform.x + platform.width / 2, platform.y + 5).setSize(platform.width, 10).setDisplaySize(platform.width, 10).setFillStyle(color, platform.kind === "fragile" ? 0.72 : 1).setStrokeStyle(platform.kind === "boost" ? 2 : 0, platform.kind === "boost" ? 0xffffff : color, platform.kind === "boost" ? 0.35 : 0);
      }
      for (const [id, view] of this.platforms) if (!live.has(id)) { view.destroy(); this.platforms.delete(id); }
      this.scoreLabel?.setText(`Score ${this.state.score}`); this.heightLabel?.setText(`Height ${Math.round(this.state.heightClimbed / 10)}m`); this.bestLabel?.setText(`${SKY_TIERS[skyTier(bestScore)]} · Best ${bestScore}`);
      mount.dataset.skyX = this.state.playerX.toFixed(1); mount.dataset.skyHeight = this.state.heightClimbed.toFixed(1); mount.dataset.skyMode = this.state.mode;
    }
    private endRun() {
      const oldTier = skyTier(bestScore); bestScore = Math.max(bestScore, this.state.score); const newTier = skyTier(bestScore); writeLocalGameValue(bridge.gameSlug, "high-score", SAVE_VERSION, bestScore);
      bridge.emit("game_over", { score: this.state.score, height: Math.round(this.state.heightClimbed), landings: this.state.landings, best_score: bestScore, ascent_tier: newTier });
      if (newTier > oldTier) { bridge.emit("game_action", { action: "ascent_tier_up", tier: newTier }); bridge.setStatus(`New ascent tier unlocked — ${SKY_TIERS[newTier]}`); } else bridge.setStatus(`Fall ended — ${this.state.score} points · press R to climb again`); tone(110, 0.22, 0.055);
      this.gameOverTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 18, "FALL", { color: "#f7fbff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "32px", fontStyle: "bold" }).setOrigin(0.5).setDepth(7);
      this.gameOverDetail = this.add.text(this.scale.width / 2, this.scale.height / 2 + 28, `${Math.round(this.state.heightClimbed / 10)}m climbed · ${this.state.score} points\nPress R or Restart`, { color: "#91a4c6", align: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", lineSpacing: 6 }).setOrigin(0.5).setDepth(7);
    }
    private resetRun() {
      this.gameOverTitle?.destroy(); this.gameOverDetail?.destroy(); this.gameOverTitle = undefined; this.gameOverDetail = undefined;
      for (const view of this.platforms.values()) view.destroy(); this.platforms.clear();
      const tier = skyTier(bestScore); this.state = createSkyboundState(this.scale.width, this.scale.height); this.state.platforms = this.state.platforms.map((platform,index) => index < 3 ? { ...platform, width: platform.width + tier * 8 } : platform); this.statusElapsed = 0; this.syncVisuals();
      bridge.setStatus(`Skybound live — ${SKY_TIERS[tier]} · green normal, gold boost, pink fragile`); bridge.emit("game_started", { mode: "endless-climb", best_score: bestScore, ascent_tier: tier });
    }
    private handleResize() { this.bestLabel?.setPosition(this.scale.width - 22, 22); this.hintLabel?.setPosition(this.scale.width / 2, this.scale.height - 24); this.gameOverTitle?.setPosition(this.scale.width / 2, this.scale.height / 2 - 18); this.gameOverDetail?.setPosition(this.scale.width / 2, this.scale.height / 2 + 28); this.resetRun(); }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: mount, backgroundColor: BACKGROUND, transparent: false, scene: [SkyboundScene], scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" }, render: { antialias: true, pixelArt: false } });
  return { pause() { game.scene.pause("skybound"); bridge.setStatus("Paused"); }, resume() { game.scene.resume("skybound"); bridge.setStatus("Skybound resumed"); }, restart() { game.scene.stop("skybound"); game.scene.start("skybound"); }, setMuted(nextMuted: boolean) { muted = nextMuted; }, destroy() { delete mount.dataset.skyX; delete mount.dataset.skyHeight; delete mount.dataset.skyMode; game.destroy(true); void audioContext?.close(); audioContext = null; } } satisfies GameRuntimeController;
}
