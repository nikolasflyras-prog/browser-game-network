# Finance gameplay rebuild

The old Learn-game pattern is retired for finance. A game does not qualify just because numbers update on a timer.

## Non-negotiable bar

- Normal successful runs should last roughly 3–8 minutes.
- The player controls a character, cursor, vehicle, or spatial tool continuously.
- The playfield is the primary surface. HUD exists to support play, not replace it.
- Multiple systems run at once: movement, objectives, hazards, resource/risk state, and escalation.
- Decisions happen through gameplay verbs such as move, carry, place, route, hedge, intercept, build, or repair—not a row of strategy buttons.
- Failure and recovery must be visible and skill-based.
- The educational concept is learned by doing the mechanic repeatedly under pressure.

## Market Maker 0.3 direction

Fantasy: you are a junior dealer physically running a trading floor during a volatile session.

Primary verbs: move, pick up client orders, route orders to liquidity venues, execute, hedge inventory, dash between stations.

World: a 2.5D trading floor with three client desks, three liquidity venues, a hedge station, desk islands, moving price conditions, timed client tickets, and periodic market shocks.

Session: 210 seconds. Client orders arrive continuously and expire if ignored. Safe venues fill reliably at tighter spreads; wider venues pay more when they fill but reject more often. Filled client flow changes inventory. The hedge station reduces inventory at a cost. Inventory risk accrues continuously while fair value moves.

Loss/finish: reputation can collapse from missed client orders, or the closing bell ends the run. Final score reflects marked P&L, completed client flow, service quality, and accumulated inventory risk.

This replaces the previous posture-button dashboard rather than extending it.
