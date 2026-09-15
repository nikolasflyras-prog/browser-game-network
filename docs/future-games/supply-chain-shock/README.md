# Supply Chain Shock

**Lane:** LEARN  
**Status:** staged prototype — headless playtest-ready  
**Primary hypothesis:** can a scenario-driven operations game attract business-school/search traffic while still feeling like a game rather than a quiz?

## Fantasy

You run operations for a consumer-electronics company through a concentrated disruption sequence. Demand swings, suppliers fail, freight costs spike, and executives still expect high service levels without bloated inventory.

## What the player learns

- safety stock and service-level tradeoffs;
- single-source versus diversified sourcing;
- lead-time risk;
- expedite cost;
- capacity buffers;
- working-capital consequences of excess inventory;
- why resilience has a cost before the disruption arrives;
- why preparation choices unlock or remove later response options.

## Core loop

1. Review cash, service level, inventory, backlog, and resilience.
2. Read one disruption or demand signal.
3. Choose one operating response.
4. See immediate metric changes and any consequences of earlier preparation.
5. Receive a one-sentence causal explanation.
6. Continue through the scenario pack.

Target session: 4–6 minutes. The first version uses a fixed deterministic pack so scores are comparable and every path can be exhaustively audited before UI work.

## Path dependence

The simulation now carries preparation forward instead of treating every scenario as independent.

- Building safety stock materially cushions the later port delay and consumes that inventory buffer.
- Qualifying a second supplier is expensive up front, but it is the only preparation path that unlocks **Activate alternate capacity** during the supplier shutdown.
- Waiting preserves cash but leaves the player dependent on expensive or service-damaging emergency responses.

## Headless mechanic gate

The scenario auditor enumerates every legal decision path.

Before UI promotion:

- alternate capacity may only be activated when prior resilience investment actually made it available;
- dual sourcing and safety stock must both remain competitive preparation strategies rather than one universally dominating the other;
- strong and weak paths need enough final-score separation for decisions to feel causal rather than cosmetic.

## Score

Reward high service and resilience, but penalize backlog, excess inventory, and cash burn. A player who simply spends on every emergency should not win.

`0.35 × service + 0.25 × resilience + 0.20 × cash health + 0.20 × backlog control`

with an excess-inventory penalty above the healthy band.

## Controls

Three large response cards per event. Touch-first, keyboard optional. An unavailable response may remain visible but disabled when doing so teaches the consequence of an earlier decision.

## Analytics hypothesis

Track scenario choice, unavailable-choice impressions, metric deltas, final operating style, completion, replay, and inbound landing page/search category.

Success signal: strong completion and search engagement even if replay is lower than PLAY games.

## Expansion path

- semiconductor supply chain pack;
- food/perishables pack;
- automotive just-in-time pack;
- port strike / geopolitical shock pack;
- professor-created fixed challenge links later;
- compare-your-strategy results cards.

## Visual direction

Use a simplified network map plus four or five large operating metrics. Avoid spreadsheet aesthetics. The map is explanatory; the decision cards are the interaction focus.
