# Future Games Balance Notes

This file records headless mechanic findings before any staged candidate receives public UI work. The goal is to kill dominant strategies and cosmetic mechanics while changes are still cheap.

## Traffic Control

### Problem found

The first deterministic model used roughly symmetric independent arrivals. In a 128-seed audit, a fixed switch cadence around 18–20 ticks could outperform a simple queue-aware policy. That violated the acceptance rule that the game must not collapse into periodic tapping.

### Change

Traffic now arrives in deterministic, seeded demand waves. One axis receives heavier flow for a bounded period while the other receives lighter flow, and the heavy axis changes over time. Difficulty still rises through the base spawn interval rather than unreadable global speed increases.

### Current headless gate

Across 64 deterministic seeds:

- a queue-aware policy must outscore the best tested fixed cadence by at least 20%;
- a queue-aware policy must survive at least 3× longer than never switching;
- the best fixed cadence is searched across several intervals rather than hard-coded to one comparison.

The current tuning clears these gates with margin. Browser playtesting is still required because the headless policy does not measure readability, perceived fairness, or input feel.

## Market Maker

### Problem found

The first model changed the displayed bid/ask when the player selected **lean long** or **lean short**, but fill probabilities were mostly independent of the actual quote prices. Quote skew therefore looked meaningful without reliably changing order flow.

### Change

Fill probability now depends on each displayed quote's distance from fair value. Moving the ask closer to fair value attracts more customer buys; moving the bid closer attracts more customer sells. Inventory-aware skew can therefore reduce a position through the same causal mechanism the UI will teach.

The inventory risk penalty was also increased so a high-flow strategy that accumulates inventory cannot dominate solely on gross spread capture.

### Current headless gate

Across deterministic seed batches:

- tight quotes must receive materially more fills than wide quotes;
- inventory-aware quoting must reduce average absolute ending inventory versus staying balanced;
- inventory-aware play must remain economically competitive rather than becoming a pure defensive strategy.

These are balance guards, not final success metrics. Public promotion still depends on measured player behavior from the three-game MVP.
