# Phase 1 — Orbit Relay

## Goal

Ship the first real playable game on the shared browser-game foundation. Orbit Relay is deliberately small: a timing game that proves the runtime, replay loop, mobile input, score persistence, sound controls, analytics, and game-over/restart behavior before visual polish.

## Core loop

1. The player orbits the current source body.
2. Tap/click or press Space to launch tangentially.
3. Intersect the next body's capture radius before leaving the playfield.
4. A successful capture immediately creates the next relay and increases score, multiplier, orbit speed, and difficulty.
5. Missing the target ends the run.
6. Restart immediately and try to beat the local high score.

## Phase 1 acceptance criteria

- Playable with pointer, touch, and keyboard.
- Objective is understandable from the play surface without reading a manual.
- Score and multiplier update during a run.
- Local high score persists across reloads.
- Game-over state is clear and restart works.
- Shared pause and sound controls work.
- `game_started`, `level_started`, `level_completed`, and `game_over` events are emitted.
- Desktop and mobile browser smoke screenshots remain clean.
- Pure gameplay math has unit tests.

## Explicitly deferred

- Production art and sprite pipeline.
- Leaderboards/accounts.
- Global persistence.
- Achievements.
- Elaborate particles/post-processing.
- Monetization/ad placement.
