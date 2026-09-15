# Market Maker

**Lane:** LEARN  
**Status:** staged prototype — headless playtest-ready  
**Primary hypothesis:** can a finance-learning game produce short, repeatable rounds instead of one-and-done educational sessions?

## Fantasy

You are the market maker for one volatile stock. Each round you choose how aggressively to quote around fair value, absorb incoming orders, and keep inventory risk under control while the market moves.

## What the player learns

- bid/ask spread;
- liquidity provision;
- inventory risk;
- adverse selection;
- why tighter spreads win more flow but can create more exposure;
- why a market maker may skew quotes when inventory becomes unbalanced.

## Core loop

1. See current fair value, inventory, and a short market cue.
2. Choose a quoting posture: **tight**, **balanced**, **wide**, **lean long**, or **lean short**.
3. Simulated buy/sell flow arrives according to the actual bid/ask prices and directional pressure.
4. Some orders fill.
5. Fair value moves.
6. Inventory is marked to market and the player receives immediate causal feedback.
7. Repeat for 12–20 rounds.

Target session: 2–4 minutes. Every round should take under 10 seconds once learned.

## Win condition

Finish the session with positive risk-adjusted dealer P&L and inventory inside the safe band.

## Failure / pressure states

The player does not need a hard fail in the first version. Large inventory creates an increasingly visible risk penalty. A catastrophic inventory breach can become a later challenge mode only if it improves the loop.

## Scoring

`dealer score = marked dealer P&L - inventory risk penalty`

Spread capture enters dealer P&L naturally through customer fills at the bid and ask. Display both raw P&L and normalized score so players can learn the economics without needing finance expertise.

## Quote mechanics

The displayed quote must be the quote used by the simulation.

- Lowering the ask toward fair value increases the chance a customer buys from the dealer.
- Raising the bid toward fair value increases the chance a customer sells to the dealer.
- **Lean short** shifts quotes down, making customer buys more likely and helping reduce a long inventory position.
- **Lean long** shifts quotes up, making customer sells more likely and helping reduce a short inventory position.

This relationship is a hard design requirement; quote skew cannot be merely cosmetic.

## Input

Five large quote-strategy buttons work on desktop and touch. Keyboard shortcuts 1–5 are optional.

## Feedback design

After every round, show one short causal sentence such as:

- “Tight quotes won both orders, but the price fell while you were long.”
- “Wide quotes reduced your flow, so you earned less spread this round.”
- “Leaning your quotes lower helped customers buy from you and reduced your long inventory.”

The explanation is part of the game loop, not a separate textbook panel.

## Headless mechanic gate

The staged simulation includes deterministic bot policies for always-tight, always-balanced, always-wide, and inventory-aware quoting.

Before UI promotion:

- tight quotes must receive materially more fills than wide quotes;
- inventory-aware quoting must materially reduce absolute ending inventory versus staying balanced;
- inventory-aware play must remain economically competitive instead of becoming a zero-flow defensive strategy;
- no posture should dominate solely because a hidden probability ignores the displayed quote.

## Analytics hypothesis

Track `round_choice`, `spread_style`, `inventory_before`, `inventory_after`, `round_pnl`, `session_score`, `session_complete`, `restart`, and `explanation_open` only if explanations become expandable.

Success signal: completion above Run the Fed and meaningful replay because the same concept supports different market paths.

## Expansion path

- volatility regimes;
- earnings/news shocks;
- multiple assets;
- leaderboard challenge seeds;
- simplified options market making later;
- classroom challenge links with fixed seeds.

## Visual direction

Clean exchange/dealing-desk aesthetic, not a brokerage dashboard. The core visual should be the bid/fair/ask relationship, inventory meter, and incoming order flow.
