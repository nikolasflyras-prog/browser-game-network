# Future Game Template

Use this file before coding a new candidate. A game is not ready for implementation until each section has a concrete answer.

## Identity

- **Working title:**
- **Slug:**
- **Lane:** PLAY / LEARN
- **Category:**
- **Primary product hypothesis:**
- **Why this game instead of another variation of an existing game:**

## Player fantasy

One sentence describing who the player is and what they are trying to accomplish.

## Primary verbs

No more than three for the first prototype.

1.
2.
3.

## Core loop

Describe the repeatable 10–30 second loop, not the entire progression system.

## Session model

- Target first input time:
- Target run/session length:
- Restart time:
- Natural pause point:
- Natural ad-safe point:

## Win / loss / reset

- Win or completion state:
- Loss state:
- Reset behavior:
- What makes the next run meaningfully different:

## Difficulty / progression

State exactly which variables become harder and which remain stable for readability.

## Controls

Map actions first, physical inputs second.

| Action | Touch | Mouse | Keyboard |
| --- | --- | --- | --- |
| primary | | | |
| secondary | | | |
| pause | | | Escape |

## Simulation boundary

List the pure serializable state owned outside the renderer.

- entities/state:
- timers/turns:
- score/progression:
- random seed:
- completion state:

## Renderer boundary

List what Phaser/React may own but must not become game truth.

- sprites/visual entities:
- camera:
- particles/tweens:
- HUD animation:

## Analytics hypothesis

Name the behavior this game is supposed to test and the smallest event set needed to evaluate it.

Required baseline:

- `game_start`
- first meaningful action timestamp
- key decision/action events
- completion or game-over reason
- score/result
- duration
- restart
- run index within the session

## Monetization constraint

Describe where ads can appear without interrupting active input. Never design the loop around forced mid-action interruption.

## Accessibility / mobile

- minimum target size:
- color-independent state cues:
- reduced-motion behavior:
- portrait/landscape assumption:
- small-screen layout rule:

## Prototype kill criteria

Write the reasons to stop before polishing. Examples: mechanic is unreadable on mobile, optimal strategy is trivial, restart is not compelling, tutorial takes longer than the first run, or simulation has no interesting tradeoff.

## Promotion checklist

- [ ] pure simulation exists
- [ ] deterministic seed or deterministic rules where appropriate
- [ ] unit tests cover core rules
- [ ] mobile control plan exists
- [ ] first-run explanation fits on one screen
- [ ] results/restart state exists
- [ ] product hypothesis and analytics are defined
- [ ] visual identity is distinct from existing games
- [ ] browser smoke test plan exists
- [ ] no backend required for v1 unless proven necessary
