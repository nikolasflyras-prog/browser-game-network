# Future Game Acceptance + Kill Tests

These tests happen **before** visual polish or public-registry integration. A candidate that fails its mechanic test should be revised or killed while it is still cheap.

## Shared acceptance gate

Every promoted prototype must pass:

- First meaningful action is possible within 5 seconds of entering gameplay.
- Core rule can be explained in one short screen or less.
- Touch and keyboard/pointer inputs map to explicit game actions.
- Restart/reset requires no page reload.
- Simulation state is serializable and renderer-independent.
- Deterministic seeds reproduce the same challenge where determinism is part of the design.
- Result state clearly explains why the run ended.
- No persistent HUD obscures the central playfield.
- Small mobile viewport remains playable without browser zoom.
- Reduced-motion mode preserves all gameplay information.
- No ad placement interrupts active input.
- A headless balance check exists when the game is simple enough to support one; it should test for obvious dominant, cosmetic, or no-skill strategies before browser polish.

## Traffic Control

### Mechanic test
A new player should understand that switching the signal changes which queue can clear without needing lane-by-lane tutorial text.

### Headless balance gate
- queue-aware play survives at least 3× longer than never switching across a deterministic seed batch;
- queue-aware play outscores the best tested fixed-period switching policy by at least 20%;
- the fixed-period comparison searches several plausible cadences instead of using one hand-picked weak baseline;
- seeded traffic waves must create asymmetric pressure so reacting to the intersection matters.

### Must verify later in browser
- switch input feedback is immediate;
- all-red transition is visually obvious;
- queue pressure can be read without staring at a number;
- cars do not overlap or visually imply collisions when the simulation says none occurred;
- restart is one action.

### Kill/rework if
- the optimal strategy becomes a fixed periodic tapping rhythm;
- players watch meters instead of the intersection;
- average first run is too long to encourage retry;
- mobile traffic becomes unreadable.

## Switchyard Daily

### Mechanic test
A player can predict the destination of a train from visible switch states after one demonstration.

### Must verify later in browser
- active/inactive track branches are distinguishable without color alone;
- train animation reinforces routing logic;
- A/B/C/HOLD controls remain reachable in portrait mode;
- daily result/share surface does not expose solutions.

### Kill/rework if
- turns reduce to guessing rather than reasoning;
- inactive-branch switches make the puzzle feel arbitrary;
- ten trains feels repetitive before completion.

## Market Maker

### Mechanic test
After three rounds, a novice can state the basic tradeoff: tighter quotes get more flow but create more inventory/adverse-selection risk.

### Headless balance gate
- tight quotes generate materially more fills than wide quotes across deterministic seeds;
- quote skew changes flow through the actual displayed bid/ask distance from fair value, not a disconnected hidden bonus;
- inventory-aware quoting reduces average absolute ending inventory versus staying balanced;
- inventory-aware play remains economically competitive so risk control is a real strategy rather than a punishment mode.

### Must verify later in browser
- bid/fair/ask relationship is visually dominant;
- inventory direction is unambiguous;
- explanations use causal language instead of jargon;
- P&L changes can be connected to the player's choice;
- five quote postures fit comfortably on mobile.

### Kill/rework if
- players maximize one posture every round;
- P&L feels random rather than caused by decisions;
- finance terminology takes longer to explain than the game itself;
- the displayed quote and the fill model can drift apart.

## Supply Chain Shock

### Mechanic test
Choices must create visible tradeoffs between service, cash, inventory, backlog, and resilience; no option should be universally correct.

### Must verify later in browser
- network map supports the decision instead of becoming decorative clutter;
- metric deltas are readable and do not animate all at once;
- response cards fit without long scrolling on mobile;
- final operating-style label matches the underlying decisions.

### Kill/rework if
- best strategy is simply “spend to fix everything”;
- scenario text dominates screen time;
- players cannot connect resilience investments to later shocks.

## Chip Fab

### Mechanic test
Players should learn that more wafer starts/utilization can worsen good output when yield and cycle time deteriorate.

### Must verify later in browser
- affected process station is obvious;
- yield and throughput are never visually conflated;
- cycle-time direction is labeled so lower-is-better is clear;
- technical terms have optional, not mandatory, definitions.

### Kill/rework if
- specialist terminology blocks first-run understanding;
- fab-flow animation becomes decoration without explaining bottlenecks;
- capacity-first choices dominate scoring.

## Power Grid Dispatcher

### Mechanic test
Players should understand that reliability is a hard constraint while cost, emissions, storage, and reserves create tradeoffs underneath it.

### Must verify later in browser
- supply/demand balance can be read at a glance;
- reserve margin is distinct from current balance;
- storage depletion creates visible future consequences;
- grid-flow animation remains subtle and directional.

### Kill/rework if
- every event is solved by the same response type;
- cost/emissions/reliability changes feel like arbitrary point adjustments;
- users need energy-market knowledge before the first decision.

## Promotion sequence

When MVP data identifies the candidate to pursue:

1. Copy its staged logic into `src/games/<slug>/`.
2. Convert staged tests into actual Vitest coverage and make them green.
3. Keep the staged headless balance gate green after any tuning changes.
4. Build the thinnest playable runtime possible.
5. Run structured browser QA at desktop and mobile sizes.
6. Fix mechanic/readability failures before visual polish.
7. Only then add full landing copy, analytics, search metadata, and public discovery.
