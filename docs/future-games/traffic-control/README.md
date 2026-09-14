# Traffic Control

**Lane:** PLAY  
**Status:** staged prototype  
**Primary hypothesis:** can a one-input, instantly understandable arcade game beat Orbit Relay on restart rate and average sessions per user?

## Fantasy

You run a dangerously busy city intersection. Traffic keeps arriving faster. One tap flips the lights. Keep cars moving without causing a crash or letting queues gridlock.

## Primary verbs

- **Watch** approaching traffic.
- **Switch** the active light axis.
- **Survive** increasingly dense traffic waves.

## Core loop

1. Cars spawn on north/south and east/west approaches.
2. One axis is green; the other queues.
3. Tap/click/space to switch the signal after a short safety delay.
4. Passing cars increase score and combo.
5. Waiting cars increase pressure; excessive queue length causes gridlock.
6. A collision or gridlock ends the run.
7. Restart is immediate.

Target session: 45–150 seconds. Target first-input time: under 3 seconds.

## Difficulty curve

- First 15 seconds: generous spacing, teach the switch.
- 15–45 seconds: opposing bursts create timing decisions.
- 45–90 seconds: shorter gaps and longer queues.
- 90+ seconds: occasional emergency vehicles force temporary priority.

Difficulty should increase by spawn interval and wave composition, not by speeding the entire simulation until it becomes unreadable.

## Controls

- Touch/click anywhere on playfield: request signal switch.
- Space / Enter: request signal switch.
- Escape: pause.

The simulation should enforce a small amber/all-red transition so repeated tapping cannot instantly flip state.

## Scoring

- +10 per car cleared.
- Combo multiplier increases when the player clears cars without queueing any approach beyond a warning threshold.
- Near-capacity recoveries can award a small bonus, but avoid hidden scoring rules.

## Failure states

- Collision in the intersection.
- Queue exceeds maximum capacity on any approach for a grace period.

## Analytics hypothesis

Track `game_start`, `first_action_ms`, `signal_switch`, `near_gridlock`, `game_over_reason`, `score`, `duration_ms`, `restart`, and `session_run_index`.

Success signal: very high restart rate and multiple runs per session even if total duration is modest.

## Monetization layout

Keep the playfield central and uninterrupted. Reserve ad surfaces for page chrome and the results/restart state. Never place an interstitial during an active run.

## Visual direction

Top-down minimal city intersection with strong readable lane markings and traffic-light state. Cars can begin as colored rectangles; visual polish is secondary to traffic readability.

## Reusable systems created by this game

- deterministic spawn scheduler;
- escalating difficulty curve;
- one-input arcade action mapping;
- score/combo/result loop;
- queued entity visualization that can later support airport, shipping, or factory games.
