# Future Games Lab — Batch 1

This directory is a staging area for games that are intentionally **not wired into the public registry, runtime loader, sitemap, or production routes yet**.

The current MVP still follows the product rule in the root README: measure the first three games before choosing Game #4. The purpose of this lab is to make that decision fast once data exists, without forcing premature public deployment now.

## What is staged here

| Candidate | Lane | Stage | What it tests |
| --- | --- | --- | --- |
| **Traffic Control** | PLAY | playtest-ready | One-input intersection management, rapid restarts, score chasing, mobile readability, and whether reactive queue management beats rote timing. |
| **Switchyard Daily** | PLAY | simulation-ready | Daily logic habit using visible routing state rather than Linebreak's path mechanic. |
| **Market Maker** | LEARN | playtest-ready | Short finance rounds, spread/liquidity tradeoffs, inventory control, and repeatable educational play. |
| **Supply Chain Shock** | LEARN | scenario-ready | Operations decisions across service, cash, inventory, backlog, and resilience. |
| **Chip Fab** | LEARN | scenario-ready | Semiconductor ramp tradeoffs across yield, throughput, cycle time, process risk, and capital. |
| **Power Grid Dispatcher** | LEARN | scenario-ready | Energy-system tradeoffs across reliability, reserve margin, storage, emissions, and cost. |

The batch also includes a reusable deterministic scenario engine, promotion manifest, acceptance/kill tests, UI blueprints, and headless balance checks.

## Stage definitions

- **scenario-ready** — decision content and scoring model exist, but no complete deterministic round loop has been validated yet.
- **simulation-ready** — a deterministic renderer-independent simulation and tests exist.
- **playtest-ready** — the simulation also has a headless policy/balance harness designed to catch dominant or cosmetic mechanics before UI work.

`playtest-ready` does **not** mean public-ready. It only means the candidate is cheap to promote into a thin browser runtime if MVP data selects it.

## Promotion rule

Do not move a staged game into `src/games/`, `gameRegistry`, or `runtimeLoaders` until the measured beta answers which product behavior deserves expansion.

- If **Orbit Relay** leads on repeat sessions and restart rate, prioritize another compact PLAY score-chaser such as Traffic Control.
- If **Linebreak Daily** leads on day-2/day-7 return and sharing, prioritize a second daily/puzzle concept such as Switchyard Daily rather than copying its mechanic directly.
- If **Run the Fed** leads on search landings, completion, or explanatory-content engagement, prioritize Market Maker first, then Supply Chain Shock.
- If LEARN games attract high-intent traffic but sessions are too long, favor Market Maker because it is built around short repeatable rounds.
- Use Chip Fab and Power Grid Dispatcher only after the broader educational-simulation format has earned expansion into narrower technical verticals.

## Prototype standard

Every candidate should have:

- a clear fantasy and 1–3 primary verbs;
- a deterministic pure simulation module;
- a 60-second explanation of what the player is learning or mastering;
- desktop + touch input plan;
- explicit win/loss/reset state;
- analytics hypotheses before implementation;
- no backend dependency for the first public version;
- an ad-safe layout that never interrupts active input;
- a mechanic-level kill test before visual polish.

## Balance discipline

The headless harnesses are deliberately simple. They are not intended to solve the games. They exist to detect obvious failures such as:

- doing nothing being nearly as effective as playing;
- a fixed tap cadence beating reactive play;
- one quote posture dominating every Market Maker round;
- a displayed choice changing UI numbers without changing the underlying system;
- randomness swamping the effect of player decisions.

See `balance-notes.md` for the current findings.

## Integration sequence later

1. Select the candidate from actual MVP behavior rather than preference.
2. Move the selected staged logic into `src/games/<slug>/simulation/`.
3. Convert/retain its deterministic and headless balance tests and make them green.
4. Build the thinnest playable Phaser or React runtime possible.
5. Add the game to the registry as `prototype`, not `live`.
6. Run desktop + mobile browser QA and mechanic/readability playtests.
7. Fix failures before visual polish.
8. Add landing copy, analytics, search metadata, and public discovery only after the prototype earns promotion.

This lab is deliberately isolated from production so future work can accumulate in larger release batches instead of consuming a deployment for every incremental change.
