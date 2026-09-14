# Future Games Lab — Batch 1

This directory is a staging area for games that are intentionally **not wired into the public registry, runtime loader, sitemap, or production routes yet**.

The current MVP still follows the product rule in the root README: measure the first three games before choosing Game #4. The purpose of this lab is to make that decision fast once data exists, without forcing premature deployment now.

## What is staged here

1. **Traffic Control** — PLAY. One-input intersection management with escalating traffic pressure. Tests fast restarts, score chasing, mobile fit, and broad casual appeal.
2. **Market Maker** — LEARN. Quote a two-sided market, manage inventory risk, and learn spread/liquidity mechanics through rapid rounds.
3. **Supply Chain Shock** — LEARN. Allocate inventory, supplier resilience, and expedite capacity across disruption scenarios.
4. **Chip Fab** — LEARN. Balance yield, throughput, cycle time, and capital allocation while ramping a semiconductor fab.

The batch also includes a reusable deterministic scenario engine for future decision-based educational games.

## Promotion rule

Do not move a staged game into `src/games/`, `gameRegistry`, or `runtimeLoaders` until the measured beta answers which product behavior deserves expansion.

- If **Orbit Relay** leads on repeat sessions and restart rate, prioritize another compact PLAY score-chaser such as Traffic Control.
- If **Linebreak Daily** leads on day-2/day-7 return and sharing, prioritize a second daily/puzzle concept rather than copying its mechanic directly.
- If **Run the Fed** leads on search landings, completion, or explanatory-content engagement, prioritize Market Maker first, then Supply Chain Shock.
- If LEARN games attract high-intent traffic but sessions are too long, favor Market Maker because it teaches in 60–120 second rounds.

## Prototype standard

Every candidate should have:

- a clear fantasy and 1–3 primary verbs;
- a deterministic pure simulation module;
- a 60-second explanation of what the player is learning or mastering;
- desktop + touch input plan;
- explicit win/loss/reset state;
- analytics hypotheses before implementation;
- no backend dependency for the first public version;
- an ad-safe layout that never interrupts active input.

## Integration sequence later

1. Move the selected simulation into `src/games/<slug>/simulation/`.
2. Add Vitest tests and get pure logic green.
3. Build the thin Phaser or React runtime.
4. Add the game to the registry as `prototype`, not `live`.
5. Add landing copy, instructions, analytics events, and browser smoke tests.
6. Preview once, playtest, then promote.

This lab is deliberately deployment-free preparation.