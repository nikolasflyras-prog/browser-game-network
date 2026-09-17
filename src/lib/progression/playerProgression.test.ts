import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  applyProgressionEvent,
  emptyProgression,
  masteryLevel,
  progressionAwardKey,
  progressionLevel,
} from "./playerProgression";

describe("player progression", () => {
  it("awards network XP and per-game mastery from runtime events", () => {
    const started = applyProgressionEvent(emptyProgression(), { gameSlug: "market-maker", event: "game_started" });
    expect(started.xpAward).toBe(5);
    expect(started.state.sessions).toBe(1);
    expect(started.state.playedGames).toEqual(["market-maker"]);
    expect(started.state.mastery["market-maker"]?.xp).toBe(5);
    expect(started.unlocked).toContain(ACHIEVEMENTS.firstRun.id);

    const completed = applyProgressionEvent(started.state, { gameSlug: "market-maker", event: "game_over" });
    expect(completed.state.xp).toBe(30);
    expect(completed.state.completions).toBe(1);
    expect(completed.state.mastery["market-maker"]?.completions).toBe(1);
    expect(completed.unlocked).toContain(ACHIEVEMENTS.finisher.id);
  });

  it("unlocks Explorer after five distinct games", () => {
    let state = emptyProgression();
    for (const slug of ["a", "b", "c", "d", "e"]) {
      state = applyProgressionEvent(state, { gameSlug: slug, event: "game_started" }).state;
    }
    expect(state.playedGames).toHaveLength(5);
    expect(state.achievements).toContain(ACHIEVEMENTS.explorer.id);
  });

  it("unlocks Specialist through mastery without requiring every game to share mechanics", () => {
    let state = emptyProgression();
    for (let index = 0; index < 6; index += 1) {
      state = applyProgressionEvent(state, {
        gameSlug: "semiconductor-vc",
        event: "game_over",
      }).state;
    }
    expect(state.mastery["semiconductor-vc"]?.xp).toBe(150);
    expect(state.achievements).toContain(ACHIEVEMENTS.specialist.id);
    expect(masteryLevel(state.mastery["semiconductor-vc"]!.xp)).toBe(3);
  });

  it("uses predictable 100-XP network levels", () => {
    expect(progressionLevel(0)).toBe(1);
    expect(progressionLevel(99)).toBe(1);
    expect(progressionLevel(100)).toBe(2);
    expect(progressionLevel(249)).toBe(3);
  });

  it("provides stable award keys so a host can dedupe spam within a run", () => {
    expect(progressionAwardKey("game_action", { action: "research_started" })).toBe("action:research_started");
    expect(progressionAwardKey("level_completed", { action: "exit_realized" })).toBe("level:exit_realized");
    expect(progressionAwardKey("game_over")).toBe("game_over");
  });
});
