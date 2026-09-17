import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  applyProgressionEvent,
  dailyChallenges,
  emptyProgression,
  masteryLevel,
  progressionAwardKey,
  progressionLevel,
} from "./playerProgression";

describe("player progression", () => {
  it("awards network XP and per-game mastery from runtime events", () => {
    const started = applyProgressionEvent(emptyProgression("2026-09-17"), { gameSlug: "market-maker", event: "game_started", dateKey: "2026-09-17" });
    expect(started.xpAward).toBe(5);
    expect(started.state.sessions).toBe(1);
    expect(started.state.playedGames).toEqual(["market-maker"]);
    expect(started.state.mastery["market-maker"]?.xp).toBe(5);
    expect(started.unlocked).toContain(ACHIEVEMENTS.firstRun.id);

    const completed = applyProgressionEvent(started.state, { gameSlug: "market-maker", event: "game_over", dateKey: "2026-09-17" });
    expect(completed.state.xp).toBe(30);
    expect(completed.state.completions).toBe(1);
    expect(completed.state.mastery["market-maker"]?.completions).toBe(1);
    expect(completed.unlocked).toContain(ACHIEVEMENTS.finisher.id);
  });

  it("treats legacy game_completed events as real finishes", () => {
    const started = applyProgressionEvent(emptyProgression("2026-09-17"), { gameSlug: "chip-fab", event: "game_started", dateKey: "2026-09-17" });
    const completed = applyProgressionEvent(started.state, { gameSlug: "chip-fab", event: "game_completed", dateKey: "2026-09-17" });
    expect(completed.xpAward).toBe(25);
    expect(completed.state.xp).toBe(30);
    expect(completed.state.completions).toBe(1);
    expect(completed.state.mastery["chip-fab"]?.completions).toBe(1);
    expect(completed.unlocked).toContain(ACHIEVEMENTS.finisher.id);
  });

  it("unlocks Explorer after five distinct games", () => {
    let state = emptyProgression("2026-09-17");
    for (const slug of ["a", "b", "c", "d", "e"]) {
      state = applyProgressionEvent(state, { gameSlug: slug, event: "game_started", dateKey: "2026-09-17" }).state;
    }
    expect(state.playedGames).toHaveLength(5);
    expect(state.achievements).toContain(ACHIEVEMENTS.explorer.id);
  });

  it("unlocks Specialist through mastery without requiring every game to share mechanics", () => {
    let state = emptyProgression("2026-09-17");
    for (let index = 0; index < 6; index += 1) {
      state = applyProgressionEvent(state, {
        gameSlug: "semiconductor-vc",
        event: "game_over",
        dateKey: "2026-09-17",
      }).state;
    }
    expect(state.mastery["semiconductor-vc"]?.xp).toBe(150);
    expect(state.achievements).toContain(ACHIEVEMENTS.specialist.id);
    expect(masteryLevel(state.mastery["semiconductor-vc"]!.xp)).toBe(3);
  });

  it("tracks daily goals independently of each game's mechanics", () => {
    let state = emptyProgression("2026-09-17");
    state = applyProgressionEvent(state, { gameSlug: "market-maker", event: "game_started", dateKey: "2026-09-17" }).state;
    state = applyProgressionEvent(state, { gameSlug: "market-maker", event: "game_over", dateKey: "2026-09-17" }).state;
    state = applyProgressionEvent(state, { gameSlug: "chip-architect", event: "game_started", dateKey: "2026-09-17" }).state;

    const challenges = dailyChallenges(state, "2026-09-17");
    expect(challenges.every((challenge) => challenge.completed)).toBe(true);
    expect(state.daily.uniqueGames).toEqual(["market-maker", "chip-architect"]);
  });

  it("builds a consecutive-day streak and unlocks the streak badge", () => {
    let state = emptyProgression("2026-09-15");
    state = applyProgressionEvent(state, { gameSlug: "orbit-relay", event: "game_started", dateKey: "2026-09-15" }).state;
    state = applyProgressionEvent(state, { gameSlug: "vector-drift", event: "game_started", dateKey: "2026-09-16" }).state;
    state = applyProgressionEvent(state, { gameSlug: "semiconductor-vc", event: "game_started", dateKey: "2026-09-17" }).state;

    expect(state.streak).toBe(3);
    expect(state.lastPlayedDate).toBe("2026-09-17");
    expect(state.achievements).toContain(ACHIEVEMENTS.streaker.id);
    expect(state.daily.date).toBe("2026-09-17");
    expect(state.daily.sessions).toBe(1);
  });

  it("resets a streak after a missed calendar day", () => {
    let state = emptyProgression("2026-09-14");
    state = applyProgressionEvent(state, { gameSlug: "orbit-relay", event: "game_started", dateKey: "2026-09-14" }).state;
    state = applyProgressionEvent(state, { gameSlug: "orbit-relay", event: "game_started", dateKey: "2026-09-17" }).state;
    expect(state.streak).toBe(1);
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
    expect(progressionAwardKey("game_completed")).toBe("game_completed");
    expect(progressionAwardKey("game_over")).toBe("game_over");
  });
});
