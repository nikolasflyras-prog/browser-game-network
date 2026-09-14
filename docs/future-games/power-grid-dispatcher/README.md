# Power Grid Dispatcher

**Lane:** LEARN  
**Status:** staged prototype  
**Primary hypothesis:** can a visually intuitive infrastructure simulation broaden the LEARN lane beyond finance/business while preserving the same fast decision-and-feedback architecture?

## Fantasy

You are dispatching a regional power grid through one difficult day. Demand moves, renewable output changes, generators fail, fuel prices spike, and you must keep the lights on without letting cost or emissions run away.

## What the player learns

- supply must balance demand in real time;
- reserve margin and reliability;
- intermittent renewable generation;
- peaker plants versus baseload resources;
- battery storage charge/discharge tradeoffs;
- demand response;
- transmission constraints;
- cost, reliability, and emissions are competing objectives.

## Core loop

1. See demand, available generation, reserve margin, storage state, cost, and emissions.
2. Receive a grid event or forecast update.
3. Choose a dispatch response from three options.
4. Watch supply/demand rebalance and metrics move.
5. Receive one short explanation of the tradeoff.
6. Continue through six to eight time blocks.

Target session: 4–6 minutes.

## Score

Reliability is the gate. A cheap or low-emissions strategy should not score well if it causes blackouts. Once reliability is protected, reward lower cost and emissions plus healthy storage/reserve conditions.

Suggested weighting:

- 40% reliability;
- 20% cost control;
- 20% emissions control;
- 10% reserve margin;
- 10% storage health.

## Controls

Three large dispatch cards per event. The visual grid map and generation bars explain state but are not direct-manipulation requirements for v1.

## Failure states

A severe reliability event can cause a blackout strike. Two blackout strikes ends the run. Ordinary tight-reserve periods should create pressure without instant failure.

## Analytics hypothesis

Track event choice, blackout strikes, reserve margin, final cost/emissions profile, completion, replay, and acquisition channel.

## Expansion path

- different regional generation mixes;
- winter storm pack;
- high-renewables / storage-heavy future-grid pack;
- fixed classroom challenge seeds;
- optional transmission-network mode later.

## Visual direction

Use a stylized grid one-line diagram with animated power flow, a clear demand/supply balance bar, and compact metric chips. It should feel like operating infrastructure, not reading an energy dashboard.