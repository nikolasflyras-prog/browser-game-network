# Analytics

## Principle

Page views do not explain whether a game works. Track meaningful game lifecycle events while keeping the event volume small.

## Initial event vocabulary

- `game_viewed`
- `game_started`
- `game_paused`
- `game_resumed`
- `game_completed`
- `game_over`
- `game_restarted`
- `level_started`
- `level_completed`
- `daily_started`
- `daily_completed`
- `share_clicked`
- `related_game_clicked`

## Common properties

- `game_slug`
- `game_version`
- `mode`
- `input_type`
- `score`
- `session_duration_ms`
- `completion_reason`

Do not emit high-frequency movement/frame events.

## PostHog

`captureGameEvent` only initializes PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is configured. Phase 0 therefore runs without an analytics account while preserving the production integration boundary.
