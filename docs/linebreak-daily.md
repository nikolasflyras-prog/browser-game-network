# Linebreak Daily — minimum playable design

## Experiment goal

Test whether a shared daily puzzle can create a stronger reason to return and share than a pure score-chasing arcade game. The first version uses a small curated puzzle bank rather than a procedural generator so the experiment measures the game loop, not generator quality.

## Player objective

Draw one continuous route from START to EXIT before the ink budget runs out.

- Move orthogonally one cell at a time.
- Avoid blocked hazard cells.
- Pick up the KEY before crossing the GATE.
- A cell cannot be revisited, except moving back one step to undo.
- Reaching EXIT with the requirements satisfied completes the daily puzzle.
- Fewer used cells is the cleaner result.

The objective and controls should be understandable from the play surface in under 30 seconds.

## Input

- Pointer/touch: press on START, drag through adjacent cells, release whenever desired; resume from the current end of the route.
- Tap/click: tapping an adjacent cell also extends the route.
- Backtracking onto the immediately previous cell removes the last segment.
- Restart is available through the shared game toolbar.

## Daily behavior

- All players receive the same challenge for a UTC date key (`YYYY-MM-DD`).
- The date selects from a curated bank deterministically.
- Completion is stored locally by date; no account or database is required.
- The first version records completion and route length. Streak/share presentation comes after the core puzzle is proven fun and reliable.

## Minimum playable acceptance

- Same date always selects the same puzzle.
- At least five curated puzzles ship and each has a known valid solution.
- Desktop pointer and mobile touch can extend/backtrack the route.
- Key/gate ordering is enforced.
- Hazards, revisits, non-adjacent moves, and ink overflow are rejected.
- Completing EXIT produces a clear success state and persists the daily result locally.
- Restart resets the current route without erasing an already-completed daily record.
- Pure puzzle rules have unit tests.
- Existing Orbit Relay QA remains green.

## Explicitly deferred

- Procedural generation.
- Global leaderboards or accounts.
- Animated share cards.
- Competitive timing.
- Teacher/classroom features.
- Elaborate art or particle effects.
