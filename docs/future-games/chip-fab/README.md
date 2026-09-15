# Chip Fab

**Lane:** LEARN  
**Status:** staged prototype — headless playtest-ready  
**Primary hypothesis:** can a specialist technical simulation become a differentiated flagship for the LEARN lane without requiring a huge asset or backend budget?

## Fantasy

You are ramping a new semiconductor process. Customers want wafers now, finance wants utilization, engineering wants more learning cycles, and every aggressive capacity decision can hurt yield or cycle time.

## What the player learns

- yield versus throughput tradeoffs;
- defect density and process control;
- cycle time and work-in-process;
- bottleneck tools;
- learning curves during process ramp;
- preventive maintenance versus utilization;
- why capacity alone does not equal good output.

## Core loop

1. Review yield, throughput, cycle time, defect risk, cash, and customer commitments.
2. Receive a fab event: ramp pressure, tool drift, bottleneck, or maintenance window.
3. Choose one operating/capital response.
4. See immediate metric changes and a short explanation.
5. Continue through the deterministic scenario pack.

Target session: 4–7 minutes.

## Score

Reward **good die output**, not raw wafers started.

- 35% yield;
- 30% throughput;
- 15% cycle-time control;
- 10% cash health;
- 10% defect-risk control.

## Headless mechanic gate

All 81 four-event decision paths are exhaustively scored before browser work.

The current gate verifies that:

- simply running the bottleneck flat-out scores materially worse on average than adding capacity or improving scheduling;
- the overall score spread is large enough to distinguish weak and strong ramp strategies;
- future tuning cannot accidentally turn raw utilization into the dominant objective without breaking the audit.

## Controls

Three decision cards per event. A simplified fab-flow diagram can highlight the affected process area but should not require direct manipulation in v1.

## Analytics hypothesis

Track scenario choice, yield/throughput delta, final ramp style, session completion, replay, and acquisition channel. The value of this game is likely differentiated discovery more than mass casual traffic.

## Expansion path

- advanced-node versus mature-node packs;
- memory versus logic fabs;
- packaging / chiplet line;
- yield-learning challenge seeds;
- bottleneck visualizations;
- optional glossary cards for technical terms.

## Visual direction

Use an abstract cleanroom/fab-flow schematic with moving wafer lots, tool groups, and clear bottleneck highlighting. Avoid photorealistic fab art in the prototype; motion should explain flow.
