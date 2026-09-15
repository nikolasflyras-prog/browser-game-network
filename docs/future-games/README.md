# Future Games Lab — Batch 1

This directory is a staging area for games that are intentionally **not wired into the public registry, runtime loader, sitemap, or production routes yet**.

The current MVP still follows the product rule in the root README: measure the first three games before choosing Game #4. The lab exists to make that decision fast once data exists without prematurely publishing every candidate.

## Current staged portfolio

| Candidate | Lane | Stage | What it tests |
| --- | --- | --- | --- |
| **Traffic Control** | PLAY | integration-ready | One-input intersection management, rapid restarts, score chasing, mobile readability, and reactive queue management. |
| **Switchyard Daily** | PLAY | integration-ready | Daily logic habit using visible routing state rather than Linebreak's path mechanic. |
| **Market Maker** | LEARN | integration-ready | Short finance rounds, spread/liquidity tradeoffs, inventory control, and repeatable educational play. |
| **Supply Chain Shock** | LEARN | integration-ready | Operations decisions with real path dependence across inventory, resilience, service, backlog, and cash. |
| **Chip Fab** | LEARN | integration-ready | Semiconductor ramp tradeoffs across yield, throughput, cycle time, process risk, and capital. |
| **Power Grid Dispatcher** | LEARN | integration-ready | Energy-system tradeoffs with reliability constraints and finite storage across a dispatch day. |

## Stage definitions

- **scenario-ready** — decision content and scoring model exist.
- **simulation-ready** — deterministic renderer-independent logic and tests exist.
- **playtest-ready** — headless balance/skill gates exist to catch dominant, cosmetic, or no-skill mechanics.
- **integration-ready** — the candidate also has a UI-facing session/view adapter and an analytics contract, but still has no public route or registry entry.

`integration-ready` is deliberately not the same as browser-tested or public-ready. It means the remaining work after selection is mostly presentation, browser QA, tuning, and product integration rather than rebuilding core systems.

## Promotion rule

Do not move a staged game into `src/games/`, `gameRegistry`, `runtimeLoaders`, public routes, or the sitemap until measured MVP behavior selects the product hypothesis worth expanding.

- If **Orbit Relay** leads on repeat sessions/restarts, prioritize Traffic Control.
- If **Linebreak Daily** leads on day-2/day-7 return and sharing, prioritize Switchyard Daily.
- If **Run the Fed** leads on educational completion/search engagement, prioritize Market Maker first if short repeatability matters, or Supply Chain Shock if scenario depth/search intent matters more.
- Chip Fab and Power Grid Dispatcher remain strong differentiated expansions after the LEARN format itself earns more investment.

## What exists for every candidate

Every staged candidate now has:

- a clear fantasy and primary verbs;
- deterministic renderer-independent logic;
- mechanic-level tests;
- a headless balance/skill gate;
- desktop + touch input rules;
- analytics hypotheses and a concrete event/property contract;
- a UI-facing session/view adapter;
- explicit result/reset semantics;
- an ad-safe layout plan that never interrupts active input;
- no backend dependency for v1;
- no public route.

The scenario games additionally share one scenario engine, one exhaustive path auditor, and one session controller.

## Balance discipline

Headless harnesses are not intended to solve the games. They exist to detect failures while they are cheap:

- doing nothing being almost as effective as playing;
- fixed tapping beating reactive decisions;
- one quote posture dominating every round;
- duplicate target generation biasing a puzzle;
- choices that look meaningful but do not affect the underlying system;
- resources being spent more times than they exist;
- a later response being available despite missing earlier preparation;
- scoring that rewards violating a hard operating constraint.

See `balance-notes.md` for findings already caught and fixed.

## Shared promotion machinery

- `scenario-engine.ts` — deterministic state and choice rules.
- `scenario-audit.ts` — exhaustive legal-path balance analysis.
- `scenario-session.ts` — UI-ready state/session controller.
- `analytics-contracts.ts` — event/property requirements for each candidate.
- `prototype-readiness.ts` — verifies all candidates remain isolated while core promotion pieces are present.
- `promotion-kit.md` — sequence for moving the selected game into production code.

## Integration sequence later

1. Select the candidate from actual MVP behavior.
2. Copy its staged logic/session files into `src/games/<slug>/`.
3. Keep deterministic and headless balance tests green.
4. Build the thinnest playable presentation consistent with `ui-blueprints.md`.
5. Register as `prototype`, not `live`.
6. Run desktop + mobile browser QA with screenshot review.
7. Fix mechanic/readability/input failures before visual polish.
8. Add landing copy, analytics, search metadata, ads, and public discovery only after the browser prototype earns promotion.

This lab is designed to let substantial future-game work accumulate in release batches instead of consuming a deployment for every incremental change.
