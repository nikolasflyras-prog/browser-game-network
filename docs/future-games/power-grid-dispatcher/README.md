# Power Grid Dispatcher

**Lane:** LEARN  
**Status:** staged prototype — headless playtest-ready  
**Primary hypothesis:** can a visually intuitive infrastructure simulation broaden the LEARN lane beyond finance/business while preserving the same fast decision-and-feedback architecture?

## Fantasy

You are dispatching a regional power grid through one difficult day. Demand moves, renewable output changes, generators fail, and you must keep the lights on without letting cost or emissions run away.

## What the player learns

- supply must balance demand in real time;
- reserve margin and reliability;
- intermittent renewable generation;
- peaker plants versus flexible resources;
- battery storage is finite across the day;
- demand response;
- transmission constraints;
- cost, reliability, and emissions are competing objectives.

## Core loop

1. See reliability, reserve margin, storage state, cost, and emissions.
2. Receive a grid event or forecast update.
3. Choose a dispatch response from three options.
4. Watch the operating metrics move.
5. Receive one short explanation of the tradeoff.
6. Continue through the day.

Target session: 4–6 minutes.

## Reliability is a constraint, not just another bar

The headless model applies an immediate operating penalty whenever reliability falls below 92 or reserve margin falls below 40. Recovering later does not erase the fact that the system was operated unsafely during the earlier interval.

Storage choices also require enough remaining energy. A player who spends batteries on the morning ramp and again on the wind miss cannot automatically spend the same energy a third time during the heatwave.

## Headless mechanic gate

The scenario auditor enumerates every legal path and checks that:

- depleted storage removes later storage-heavy responses;
- knowingly running tight reserves scores materially worse than protecting the reliability buffer;
- the total score range remains wide enough that operating decisions matter.

## Score

Reliability is the gate. Once reliability is protected, reward lower cost and emissions plus healthy storage/reserve conditions.

Base weighting:

- 40% reliability;
- 20% cost control;
- 20% emissions control;
- 10% reserve margin;
- 10% storage health;

Immediate reliability/reserve violations are deducted separately as operating penalties.

## Controls

Three large dispatch cards per event. The visual grid map and generation bars explain state but are not direct-manipulation requirements for v1.

## Analytics hypothesis

Track event choice, reliability/reserve violations, unavailable storage responses, final cost/emissions profile, completion, replay, and acquisition channel.

## Expansion path

- different regional generation mixes;
- winter storm pack;
- high-renewables / storage-heavy future-grid pack;
- fixed classroom challenge seeds;
- optional transmission-network mode later.

## Visual direction

Use a stylized grid one-line diagram with animated power flow, a clear demand/supply balance bar, and compact metric chips. It should feel like operating infrastructure, not reading an energy dashboard.
