# Phase 2 — Site shell and discovery

## Goal

Make the browser-game network behave like a player-facing product rather than a collection of engineering routes. A visitor should be able to discover a playable game, play it, recover from a dead route, and move between Play, Learn, and Daily without encountering internal diagnostics or a dead end.

## Included

- Public game discovery filters out diagnostic runtimes.
- Games carry a simple category for future filtering and related-game logic.
- Game pages include a reusable post-game discovery surface.
- Related games populate automatically as the public registry grows.
- Learn and Daily explain the next experiments and route back into the current playable game.
- Custom 404 recovery routes users directly back to play.
- Desktop and mobile browser QA covers the public games directory and preserves the Orbit Relay playfield.

## Acceptance criteria

- `/games` contains public playable/prototype games and does not expose System Check.
- `/games/system-check` remains directly accessible for engineering QA.
- Orbit Relay has a clear post-game path to Games and Learn.
- `/learn` and `/daily` have useful product context plus a direct route into play.
- Unknown routes return 404 and offer recovery actions.
- Public directory and game-page discovery remain readable on mobile.
- Existing Orbit Relay interaction QA continues to pass unchanged.

## Deferred until more public games exist

- Category landing pages.
- Search/filter controls.
- Personalized recommendations.
- Global leaderboards/accounts.
- A CMS.
- Rich recommendation logic.
