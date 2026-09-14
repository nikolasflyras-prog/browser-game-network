# Future Games UI Blueprints

These are implementation-facing screen rules, not final art direction. The goal is to preserve the playfield, keep first action fast, and avoid turning games into generic dashboards.

## Shared UI rules

- Canvas/Phaser owns motion-heavy playfields. DOM owns instructions, dense text, settings, and results.
- First playable view should not show a long tutorial. Use one short instruction plus contextual hints.
- Persistent HUD should occupy the edges, not the center of the playfield.
- On mobile, collapse secondary metrics before shrinking the playfield below usability.
- Results screens are the primary restart/share/ad-safe surfaces.
- All games need a reduced-motion path where decorative motion is minimized but state changes remain obvious.

---

## Traffic Control

### Desktop

- Center: square/near-square top-down intersection canvas.
- Top-left compact HUD: score, combo.
- Top-right compact HUD: current pressure indicator.
- Bottom-center: one visible hint — `SPACE / TAP TO SWITCH` — fades after the first successful switch.
- No persistent sidebars.

### Mobile

- Intersection fills upper 70–75% of portrait viewport.
- Bottom strip contains a large signal-state button and score.
- Tapping the canvas also works; the button exists for accessibility and clarity.

### Results

Large score, best score, run duration, failure reason, `Again` as dominant action, `Share` secondary.

---

## Switchyard Daily

### Desktop

- Center: rail network and depot board.
- Top: daily number + progress `Train 4 / 10`.
- Bottom: four large action controls `A`, `B`, `C`, `HOLD`.
- Right edge only when room allows: strikes and compact legend.

### Mobile

- Rail board remains above controls.
- Four controls use a 2×2 grid with large labels and switch icons.
- Destination target appears directly above the board, not in a detached header.

### Results

Correct/incorrect sequence, score, streak, share grid, retry only if product policy allows daily retries.

---

## Market Maker

### Desktop

- Center: price ladder / bid-fair-ask visual.
- Left edge: inventory meter with strong zero line.
- Top: round count and marked P&L.
- Bottom: five quote posture buttons.
- After action: one transient causal explanation below the price ladder.

Avoid multi-card finance-dashboard layouts. The quote relationship is the game.

### Mobile

- Price ladder becomes vertical and dominant.
- Inventory + P&L collapse into two compact chips.
- Quote choices become horizontally scroll-free 2-row buttons.

### Results

Risk-adjusted score, raw P&L, ending inventory, style label, one paragraph explaining the player's market-making behavior.

---

## Supply Chain Shock

### Desktop

- Center-left: simplified supplier → plant → distribution → customer network.
- Top edge: five small metric chips.
- Right/bottom: current disruption card and three response choices.
- Metric changes animate near the relevant chip, then settle.

### Mobile

- Network collapses to a narrow horizontal flow diagram.
- Scenario prompt and choices take priority below it.
- Only three most relevant metrics remain expanded; others open in a compact drawer.

### Results

Operating style, final score, metric radar/bar summary, and three decision callouts explaining the biggest consequences.

---

## Chip Fab

### Desktop

- Center: horizontal fab-flow schematic with 5–7 tool-group stations.
- Affected station glows during a scenario; wafers continue moving slowly to communicate flow.
- Top: yield, throughput, cycle time, defect risk, cash.
- Bottom-right: scenario card and three choices.

### Mobile

- Fab flow becomes a horizontally scrollable schematic only between decisions; during decisions it auto-centers the affected station.
- Metrics collapse to yield, throughput, and one context metric chosen by the current event.

### Results

Ramp style, good-output score, final metrics, and a simple `what mattered` explanation emphasizing why high utilization alone did or did not work.

---

## Power Grid Dispatcher

### Desktop

- Center: stylized one-line grid / generation-to-load flow.
- Upper center: supply-demand balance bar.
- Edge chips: reliability, reserve, storage, cost, emissions.
- Bottom: event card + three dispatch choices.
- Power-flow motion remains subtle and directional.

### Mobile

- Balance bar stays fixed near top.
- Grid diagram uses simplified generation icons and one load cluster.
- Three choices occupy the bottom half during decisions.

### Results

Grid style, reliability score, blackout count if used, cost/emissions tradeoff, and a compact chart of how decisions changed the system through the day.

## Shared implementation components worth extracting later

- `MetricChip` with delta animation and reduced-motion mode.
- `DecisionCard` / `DecisionChoice` for scenario games.
- `CompactResults` with score, best, restart/share hooks.
- `PressureMeter` for real-time arcade games.
- `DailyProgress` integration for deterministic daily games.
- Responsive game-shell layout that exposes safe ad slots only outside the active playfield.