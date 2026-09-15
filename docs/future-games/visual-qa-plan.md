# Future Games Visual QA Plan

This checklist governs the next staging batch after the first six-game lab preview. It exists to keep visual review evidence at the same quality as mechanic tests without promoting any candidate publicly.

## Current verified baseline

The fixed staging head builds successfully and the lab browser smoke exercises all six candidates. The lab route remains `noindex`, outside the public game registry, and absent from public game links.

The first captured lab screenshots confirm the shell is readable on desktop and mobile and that the six candidate tabs collapse to a two-column mobile grid without overlap. Traffic Control renders inside the staged runtime shell at both viewport sizes.

## Next evidence gate

For every candidate, capture one **desktop** and one **390×844 mobile** screenshot after at least one real player decision. A green interaction smoke without a corresponding visual state is not enough to call the prototype visually reviewed.

Each capture should be checked for:

- first action is visually obvious;
- no controls overlap or fall outside the viewport;
- critical state is not communicated by color alone;
- playfield remains more visually important than lab chrome;
- decision feedback appears near the action that caused it;
- keyboard focus remains visible on DOM controls;
- reduced-motion mode preserves every gameplay fact;
- results/restart state is legible when reached;
- no framework error UI or runtime exception is present.

## PLAY-specific checks

### Traffic Control

- signal state needs a text/non-color cue in addition to red/green lamps;
- queue pressure remains readable on narrow screens;
- a requested signal change is visibly acknowledged during all-red delay;
- the intersection remains the dominant visual element.

### Switchyard Daily

- A/B/C switch labels and D0–D3 depot labels remain readable after resize;
- 2×2 compact controls do not overlap below 560 px;
- active branch remains distinguishable without relying only on yellow track color;
- reduced-motion users can understand the routed depot without waiting for a long tween.

## LEARN-specific checks

### Market Maker

- selected posture is visibly and semantically selected;
- the price ladder always shows the exact bid/ask that the next execution uses;
- inventory direction and zero line remain obvious on mobile;
- last-round feedback connects fill behavior to the quote decision.

### Scenario games

- the scenario prompt and three choices remain the primary interaction focus;
- metric rails wrap cleanly rather than shrinking into unreadable chips;
- unavailable choices explain why without breaking keyboard navigation;
- result style + score fit without horizontal overflow.

## Deployment discipline

Do not move the staging branch for screenshot-only or single-prototype tweaks. Accumulate visual QA fixes in hidden commits, then move the branch once when a coherent batch is ready for one preview build.
