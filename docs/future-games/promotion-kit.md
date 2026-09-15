# Future Game Promotion Kit

This layer exists so the measured winner can move from lab candidate to browser prototype without rebuilding session state, analytics, or decision plumbing from scratch.

## What is reusable now

### Scenario engine
`scenario-engine.ts` owns deterministic metric changes, constraints, conditional impacts, choice availability, scoring hooks, and serializable state.

### Scenario auditor
`scenario-audit.ts` exhaustively enumerates legal paths. It is the cheap place to catch dominant strategies, irrelevant choices, impossible resource use, and weak score separation.

### Scenario session
`scenario-session.ts` converts an audited scenario pack into a UI-ready session model:

- current step and progress;
- metrics;
- available and unavailable choices;
- unavailable-choice explanations;
- previous causal feedback;
- completion state;
- final score and operating style.

Supply Chain Shock, Chip Fab, and Power Grid Dispatcher already expose prototype definitions through this interface.

### Analytics contracts
`analytics-contracts.ts` defines the minimum event/property contract for every staged game. Detailed player actions use the shared `game_action` lifecycle event instead of creating a new analytics event name for every mechanic.

## Promotion path when data selects a winner

1. Copy the selected lab simulation/session files into `src/games/<slug>/`.
2. Keep the deterministic and balance tests intact.
3. Bind the session/view model to the thinnest usable DOM or Phaser presentation.
4. Map the staged analytics contract onto `GameBridge.emit` / `captureGameEvent`.
5. Register as `prototype`, not `live`.
6. Run browser QA at desktop and mobile sizes, including screenshots.
7. Fix readability/input failures before adding visual polish.
8. Only after playtesting passes: add discovery, SEO copy, ads, related-game modules, and public promotion.

## Deliberate non-goals in the lab

- No public route.
- No sitemap entry.
- No registry entry.
- No production loader entry.
- No ad placement inside active gameplay.
- No backend dependency for v1.

The lab should reduce time-to-prototype without pre-committing the network to a game that the MVP data has not selected.
