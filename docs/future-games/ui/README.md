# Non-routed prototype UI

These components are intentionally not imported by any production route. They are implementation-ready surfaces for candidates that have already passed headless mechanic gates.

## Included

- `ScenarioPrototype.tsx` — shared playable shell for deterministic decision simulations.
- `ScenarioVisuals.tsx` — lightweight game-world visuals for Supply Chain Shock, Chip Fab, and Power Grid Dispatcher.
- `ScenarioGamePrototypes.tsx` — three specific LEARN prototypes bound to audited definitions.
- `MarketMakerPrototype.tsx` — playable round-based Market Maker surface.
- `PrototypeLab.module.css` — low-chrome responsive presentation with reduced-motion behavior.

## Design constraints

- The central game state stays visually dominant.
- Metrics remain an edge rail rather than a dashboard wall.
- Decision choices are the primary interaction surface.
- Unavailable choices stay visible when they teach path dependence.
- Mobile collapses choices before shrinking the game-state visual into unreadability.
- No ads, public route, sitemap entry, registry entry, or backend dependency exists here.

Traffic Control and Switchyard Daily should use motion-first Phaser/canvas runtimes when selected; their pure session adapters are staged separately.
