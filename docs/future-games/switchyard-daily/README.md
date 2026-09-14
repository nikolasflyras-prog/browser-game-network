# Switchyard Daily

**Lane:** PLAY  
**Status:** staged concept + simulation  
**Primary hypothesis:** if Linebreak Daily proves daily-return behavior, can a second deterministic daily puzzle create habit without copying the same path-drawing mechanic?

## Fantasy

You are the switch operator for a compact rail yard. Each arriving train has a destination. Before it reaches the junction, you may flip one switch. Route as many trains as possible to the correct depot.

## Primary verbs

- **Read** the current switch state and train destination.
- **Flip** one switch or hold.
- **Route** the train and learn the network.

## Core loop

1. Show three binary switches and four destination depots.
2. Reveal the next train's required depot.
3. Player may flip switch A, B, C, or hold.
4. Train animates through the network.
5. Correct route scores; wrong route costs a strike.
6. Ten trains form the daily puzzle. Three strikes ends the run early.

The simulation intentionally generates each target from a state reachable with at most one legal action, so every round is solvable.

## Why it is distinct from Linebreak Daily

Linebreak is spatial path planning with ink/key/gate constraints. Switchyard is state transformation and network reasoning under a one-action budget. It can share daily seed/streak/share infrastructure while testing a different cognitive loop.

## Controls

- Four large buttons: A, B, C, HOLD.
- Keyboard: A/B/C and Space.
- Touch targets should remain visible below the playfield in portrait mode.

## Difficulty progression

- Early rounds highlight the active branch.
- Mid rounds remove branch highlighting.
- Later rounds shorten the pre-arrival decision timer in challenge mode, but the baseline daily puzzle should remain untimed.

## Results / sharing

Share only compact result symbols such as correct/incorrect sequence and score. Never expose the actual target solution before the daily window ends if competitive sharing is added.

## Analytics hypothesis

Measure daily completion, strike distribution, retry behavior, day-2/day-7 return, and share rate. Promote only if daily behavior—not just one-session completion—justifies another daily title.

## Visual direction

Clean miniature rail-yard board with chunky switches and obvious branch states. Train motion should make the routing logic easier to understand, not just decorate it.