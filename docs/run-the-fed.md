# Run the Fed — MVP design

## Purpose

Teach monetary-policy tradeoffs through a short simulation rather than a quiz. The player controls the policy rate quarter by quarter and sees how inflation, unemployment, growth, spending, investment, asset prices, and financial stability respond.

## Core loop

1. Read the current macro dashboard and any scenario shock.
2. Set the policy rate in 25 bp increments.
3. Advance one quarter.
4. See what changed and why.
5. Repeat for eight quarters.
6. Receive a score and a short post-run diagnosis.

## MVP rules

- One main policy lever: the policy rate.
- Five deterministic scenarios: soft landing, inflation shock, recession, asset bubble, and energy shock.
- Eight quarters per run.
- The model is intentionally educational, not a forecasting or econometric model.
- Policy above the neutral rate cools demand, inflation, growth, and asset prices over time while tending to raise unemployment.
- Policy below neutral supports demand, growth, investment, and asset prices while tending to add inflation pressure.
- Large or rapid rate moves can reduce financial stability.
- Scenario shocks alter supply, demand, or financial conditions at known quarters.

## Win condition

There is no binary win/loss. The player is scored on balancing:

- inflation near 2%
- unemployment near a sustainable range
- real growth near trend
- financial stability
- avoiding unnecessary policy volatility

The score is descriptive, not a claim about real Federal Reserve policy quality.

## Architecture

- `model.ts`: scenario data, simulation state, quarter transition, score, and explanatory text.
- React/DOM: policy controls, macro dashboard, quarter history, explanations, and results.
- Phaser is optional for this game; the MVP should not force a text-heavy macro dashboard into canvas.
- Local storage can later preserve best score by scenario.

## Deferred

- balance-sheet policy / QE-QT
- forward guidance
- exchange-rate channel
- fiscal policy
- multiplayer or leaderboards
- stochastic Monte Carlo shocks
- account-based progress
