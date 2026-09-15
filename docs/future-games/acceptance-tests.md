# Future Game Acceptance + Kill Tests

These tests happen **before** visual polish or public-registry integration. A candidate that fails its mechanic test should be revised or killed while it is still cheap.

## Shared acceptance gate

Every promoted prototype must pass:

- First meaningful action is possible within 5 seconds of entering gameplay.
- Core rule can be explained in one short screen or less.
- Touch and keyboard/pointer inputs map to explicit actions.
- Restart/reset requires no page reload.
- Simulation state is serializable and renderer-independent.
- Deterministic seeds reproduce the same challenge where determinism is part of the design.
- Result state clearly explains why the run ended or what the player learned.
- No persistent HUD obscures the central playfield.
- Small mobile viewport remains playable without browser zoom.
- Reduced-motion mode preserves all gameplay information.
- No ad placement interrupts active input.
- Detailed actions map to the shared analytics lifecycle through `game_action` or `level_completed` rather than ad-hoc event-name sprawl.
- A headless balance gate exists before browser polish.

## Traffic Control

### Headless gate
- queue-aware play survives at least 3× longer than never switching;
- queue-aware play outscores the best tested fixed cadence by at least 20%;
- the fixed-cadence comparison searches several plausible intervals;
- seeded asymmetric waves force reactive play.

### Browser gate later
- signal change feedback is immediate;
- the all-red transition is obvious;
- queue pressure is readable from the intersection, not only a meter;
- mobile traffic remains legible;
- restart is one action.

### Kill/rework if
- optimal play becomes a metronomic tap rhythm;
- players watch HUD meters instead of traffic;
- first runs are too long to encourage retry.

## Switchyard Daily

### Headless gate
- an oracle using only visible state solves every deterministic seed;
- no blind HOLD/A/B/C policy wins more than 10% of ten-train puzzles;
- targets are sampled from distinct reachable depots rather than duplicated action outcomes.

### Browser gate later
- active/inactive branches are distinguishable without color alone;
- train motion reinforces routing logic;
- A/B/C/HOLD remains comfortable in portrait mode;
- sharing never leaks the solution.

### Kill/rework if
- turns reduce to guessing;
- inactive branch state feels arbitrary instead of learnable;
- ten trains becomes repetitive before completion.

## Market Maker

### Headless gate
- tight quotes materially increase fills versus wide quotes;
- displayed bid/ask distance is the mechanism that changes fill probability;
- inventory-aware quote skew materially reduces ending inventory risk;
- defensive play remains economically competitive rather than earning nothing.

### Browser gate later
- bid/fair/ask relationship is the visual focus;
- inventory direction is unambiguous;
- feedback is causal and jargon-light;
- five quote postures fit without horizontal scrolling on mobile.

### Kill/rework if
- one posture is optimal every round;
- P&L feels random rather than caused by choices;
- terminology takes longer to explain than the game itself.

## Supply Chain Shock

### Headless gate
- alternate capacity is unavailable unless earlier preparation created it;
- safety stock is actually consumed to cushion a later delay;
- dual sourcing and safety stock remain competitive preparation strategies;
- legal paths have meaningful final-score separation.

### Browser gate later
- unavailable choices teach consequences rather than feeling like arbitrary disabled buttons;
- network map supports the decision instead of becoming decorative clutter;
- metric deltas do not all animate at once;
- response cards remain short enough for mobile.

### Kill/rework if
- the best strategy is simply “spend to fix everything”;
- scenario text dominates screen time;
- early resilience/inventory choices do not visibly matter later.

## Chip Fab

### Headless gate
- all 81 four-event paths remain enumerable;
- maximizing bottleneck utilization scores materially worse on average than sensible capacity/scheduling responses;
- score spread remains large enough to distinguish strong and weak ramp paths.

### Browser gate later
- affected process station is obvious;
- yield and throughput are never visually conflated;
- lower-is-better cycle time is labeled clearly;
- technical terms use optional definitions.

### Kill/rework if
- specialist terminology blocks first-run understanding;
- fab-flow motion becomes decoration;
- raw capacity/utilization becomes the dominant score strategy.

## Power Grid Dispatcher

### Headless gate
- storage-heavy responses require enough remaining storage;
- the player cannot spend the same stored energy three times;
- unsafe reliability/reserve intervals incur immediate penalties that cannot be erased by later recovery;
- legal paths retain meaningful score separation.

### Browser gate later
- supply/demand balance is readable at a glance;
- reserve margin is visually distinct from current balance;
- storage depletion creates an obvious future consequence;
- grid-flow motion is subtle and directional.

### Kill/rework if
- every event is solved by the same response type;
- cheap/low-emissions play can ignore reliability;
- users need energy-market knowledge before the first decision.

## Promotion sequence

When MVP data identifies the candidate to pursue:

1. Copy the staged simulation/session into `src/games/<slug>/`.
2. Keep deterministic logic, balance audits, and integration-adapter tests green.
3. Bind it to the thinnest usable presentation.
4. Run structured browser QA at desktop and mobile sizes with screenshot review.
5. Fix mechanic/readability failures before visual polish.
6. Add full landing copy, analytics, search metadata, and public discovery only after the prototype passes.
