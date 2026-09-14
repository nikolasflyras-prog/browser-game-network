# Architecture

## Goal

Build a repeatable game-development machine rather than a collection of unrelated mini-sites.

## Non-negotiable boundaries

### Simulation
Owns saveable, deterministic game state: rules, entities, timers, progression, scoring, objectives, and decisions.

### Renderer
Phaser owns sprites, animation, camera, particles, canvas/WebGL, and translating player input into abstract game actions. Renderer objects are disposable view state.

### DOM / React
Owns text-heavy HUD, pause/settings, results, explanatory education, sharing, related games, and accessibility-sensitive controls.

## Game loading

Game pages are server-rendered by Next.js. `GameHost` is the client boundary. A game runtime is dynamically imported by slug, so Phaser is not part of ordinary content-page JavaScript until a playable game is mounted.

## Registry

`src/games/registry.ts` is metadata only and is safe for server components. Runtime imports live in `src/games/loaders.ts` so game-engine code stays behind a client-side dynamic import.

## Shared runtime contract

Each game runtime exposes `mountGame(mount, bridge)` and returns a controller with `pause`, `resume`, `restart`, and `destroy`. Shared UI therefore does not depend on the implementation details of a specific game.

## Input

Gameplay code should consume actions such as `confirm`, `pause`, `move-left`, or `ability-1`. Physical keyboard, mouse, touch, and future gamepad mappings belong in one input layer.

## Storage

Phase 0 uses versioned `localStorage` records. Never persist Phaser objects. Save serializable simulation state only.

## Analytics

Games emit a small, consistent event vocabulary through `captureGameEvent`. The adapter can forward to PostHog when configured and remains inert otherwise.

## Assets

Each game owns assets under `/public/games/<slug>/`. Use stable manifest keys inside game code rather than scattering raw asset paths through systems.

## Database

None in Phase 0. Add one only when cross-device identity, global leaderboards, cloud saves, classroom state, or similar server-owned data becomes necessary.
