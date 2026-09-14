# Browser Game Network

A shared browser-game platform for two product lanes:

- **PLAY** — polished, replayable entertainment games.
- **LEARN** — interactive educational simulations that teach through systems and decisions.

The project is currently in **Phase 5: measured beta launch readiness**. The first three-game MVP is built; the immediate priority is deploying the current production revision, activating measurement, getting real users, and learning before expanding the catalog.

## Current MVP

- **Orbit Relay** — timing/replayability game and shared-runtime proof.
- **Linebreak Daily** — deterministic daily puzzle with local completion history, streaks, and sharing.
- **Run the Fed** — eight-quarter monetary-policy simulation with scoring and explanatory content.

The site also includes public game guides, related-game discovery, sitemap/robots/canonical metadata, About/Privacy/Terms pages, local progress persistence, explicit game lifecycle analytics, and route-level pageview attribution.

## Stack

- Next.js App Router + TypeScript
- React for site/UI surfaces
- Phaser for 2D playfields
- PostHog-compatible analytics adapter
- Vitest for pure logic/unit tests
- GitHub Actions for lint/typecheck/unit/build/browser/SEO regression gates
- Vercel for previews and production

## Architecture rule

Simulation state and game rules stay outside the renderer. Phaser owns presentation, animation, cameras, and input plumbing. React/DOM owns menus, HUD, results, explanatory content, and accessible controls.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local URL. Public games live under `/games`; `/games/system-check` is an engineering diagnostic and is intentionally excluded from discovery and indexing.

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

`npm run check` runs the core local sequence. Pull-request CI additionally runs browser gameplay regressions, the Run the Fed interaction test, screenshots, and SEO checks.

## Analytics

PostHog initializes only when `NEXT_PUBLIC_POSTHOG_KEY` is configured. The app remains fully playable without analytics.

The measurement layer intentionally uses explicit, low-volume lifecycle events plus route-level `$pageview` capture. Autocapture and session replay are disabled in the current configuration.

See `docs/analytics.md` and `docs/launch.md` before enabling production measurement.

## Documentation

- `docs/architecture.md`
- `docs/game-development.md`
- `docs/analytics.md`
- `docs/deployment.md`
- `docs/launch.md`

## Product sequence

1. Phase 0 — shared architecture
2. Orbit Relay — infrastructure/replayability test
3. Linebreak Daily — daily-return/shareability test
4. Run the Fed — educational/SEO test
5. SEO + analytics foundation
6. Measured beta launch
7. **Review real-user data before Game #4**

The long-term goal remains the same: make Game #10 materially easier to build, test, publish, and improve than Game #1.
