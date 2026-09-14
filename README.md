# Browser Game Network

A shared browser-game platform for two product lanes:

- **PLAY** — polished, replayable entertainment games.
- **LEARN** — interactive educational simulations that teach through systems and decisions.

This repository is currently in **Phase 0: architecture**. The goal is to make Game #10 materially easier to build than Game #1.

## Stack

- Next.js App Router + TypeScript
- React for site/UI surfaces
- Phaser for 2D playfields
- PostHog-compatible analytics adapter
- Vitest for pure logic/unit tests
- Vercel for previews and production

## Architecture rule

Simulation state and game rules stay outside the renderer. Phaser owns presentation, animation, cameras, and input plumbing. React/DOM owns menus, HUD, results, explanatory content, and accessible controls.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local URL and visit `/games/system-check`.

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

`npm run check` runs the complete sequence.

## Phase 0 diagnostic scene

`/games/system-check` is intentionally not a production game. It proves the shared foundation can:

- lazy-load Phaser only on a game page;
- accept keyboard and pointer/touch input;
- resize with its host container;
- pause, resume, restart, and destroy cleanly;
- persist local test state;
- emit gameplay analytics events through one adapter.

## Documentation

- `docs/architecture.md`
- `docs/game-development.md`
- `docs/analytics.md`
- `docs/deployment.md`

## Product sequence

1. Phase 0 — shared architecture
2. Orbit Relay — infrastructure/replayability test
3. Linebreak Daily — daily-return/shareability test
4. Run the Fed — educational/SEO test
5. Measure before expanding
