# Market Maker

**Lane:** LEARN  
**Status:** staged prototype  
**Primary hypothesis:** can a finance-learning game produce short, repeatable rounds instead of one-and-done educational sessions?

## Fantasy

You are the market maker for one volatile stock. Each round you choose how aggressively to quote around fair value, absorb incoming orders, and keep inventory risk under control while news moves the market.

## What the player learns

- bid/ask spread;
- liquidity provision;
- inventory risk;
- adverse selection;
- why tighter spreads win flow but expose the dealer to more risk;
- why a market maker may skew quotes when inventory becomes unbalanced.

## Core loop

1. See current fair value, volatility, inventory, and a short market cue.
2. Choose a quoting posture: **tight**, **balanced**, **wide**, **lean long**, or **lean short**.
3. Simulated buy/sell flow arrives.
4. Some orders fill depending on spread and flow pressure.
5. Fair value moves.
6. Inventory is marked to market and the player receives immediate feedback explaining the result.
7. Repeat for 12–20 rounds.

Target session: 2–4 minutes. Every round should take under 10 seconds once learned.

## Win condition

Finish the session with positive risk-adjusted dealer P&L and inventory inside the safe band.

## Failure / pressure states

The player does not need a hard fail on the first version. Instead, large inventory creates an increasingly visible risk penalty. A catastrophic inventory breach can end a challenge mode later.

## Scoring

`dealer score = realized spread capture + marked inventory P&L - inventory risk penalty`

Display both raw P&L and a normalized score so players learn the economics without needing finance expertise.

## Input

Five large quote-strategy buttons work on desktop and touch. Keyboard shortcuts 1–5 are optional.

## Feedback design

After every round, show one short causal sentence such as:

- “Tight quotes won both orders, but the price fell while you were long.”
- “Wide quotes protected you from adverse selection, but you earned no spread.”
- “Leaning your bid lower helped reduce long inventory.”

The explanation is part of the game loop, not a separate textbook panel.

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