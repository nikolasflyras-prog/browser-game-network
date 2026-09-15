# Traffic Control

**Lane:** PLAY  
**Status:** staged prototype — headless playtest-ready  
**Primary hypothesis:** can a one-input, instantly understandable arcade game beat Orbit Relay on restart rate and average sessions per user?

## Fantasy

You run a dangerously busy city intersection. Traffic keeps arriving faster. One tap flips the lights. Keep cars moving without letting queues gridlock.

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
6. Demand shifts in seeded waves so the player must react to the intersection rather than memorize a switch cadence.
7. Gridlock ends the run.
8. Restart is immediate.

Target session: 45–150 seconds. Target first-input time: under 3 seconds.

## Difficulty curve

- First 15 seconds: generous spacing, teach the switch.
- 15–45 seconds: opposing demand waves create timing decisions.
- 45–90 seconds: shorter gaps and longer queues.
- 90+ seconds: denser waves; emergency-priority events can be explored later only if the base loop needs more variety.

Difficulty should increase by spawn interval and wave composition, not by speeding the entire simulation until it becomes unreadable.

## Controls

- Touch/click anywhere on playfield: request signal switch.
- Space / Enter: request signal switch.
- Escape: pause.

The simulation enforces a small all-red transition so repeated tapping cannot instantly flip state.

## Scoring

- +10 per car cleared, plus a visible combo bonus.
- Combo grows while the player continues clearing traffic and decays under sustained queue pressure.
- Avoid hidden scoring rules in the public version.

## Failure state

- Queue exceeds maximum capacity on any approach: **gridlock**.

A collision mode should not be added until the simulation explicitly models in-intersection occupancy. The first version should not visually imply a collision that the state model cannot represent.

## Headless mechanic gate

The staged simulation includes deterministic bot policies for **idle**, **queue-aware pressure**, and **fixed periodic switching**.

Before UI promotion:

- queue-aware play must survive at least 3× longer than doing nothing;
- queue-aware play must outscore the best tested fixed cadence by at least 20%;
- the best fixed cadence is searched across multiple intervals so the test cannot be gamed by comparing against one weak rhythm.

The current wave-based tuning passes these gates. Browser playtesting still needs to prove that players can read the same information the bot sees.

## Analytics hypothesis

Track `game_start`, `first_action_ms`, `signal_switch`, `near_gridlock`, `game_over_reason`, `score`, `duration_ms`, `restart`, and `session_run_index`.

Success signal: very high restart rate and multiple runs per session even if total duration is modest.

## Monetization layout

Keep the playfield central and uninterrupted. Reserve ad surfaces for page chrome and the results/restart state. Never place an interstitial during an active run.

## Visual direction

Top-down minimal city intersection with strong readable lane markings and traffic-light state. Cars can begin as colored rectangles; visual polish is secondary to traffic readability.

## Reusable systems created by this game

- deterministic spawn scheduler;
- seeded asymmetric demand waves;
- escalating difficulty curve;
- one-input arcade action mapping;
- score/combo/result loop;
- queued entity visualization that can later support airport, shipping, or factory games;
- headless dominant-strategy testing for future arcade prototypes.
