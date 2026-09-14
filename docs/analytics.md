# Analytics

## Principle

Page views explain acquisition and retention; game events explain whether the games work. Track both while keeping event volume small and avoiding high-frequency movement/frame events.

## Site event

- `$pageview`
  - emitted on initial load and client-side route changes
  - includes `$current_url`, `$pathname`, `$referrer`, and any `utm_*` campaign parameters present in the URL

This gives the launch funnel a stable visitor, entry-page, and traffic-source event and supports returning-user analysis without requiring accounts.

## Game event vocabulary

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

## Common game properties

- `game_slug`
- `game_version`
- `mode`
- `input_type`
- `score`
- `session_duration_ms`
- `completion_reason`

## PostHog configuration

The client initializes only when `NEXT_PUBLIC_POSTHOG_KEY` is configured. Set:

- `NEXT_PUBLIC_POSTHOG_KEY` — the public PostHog project key
- `NEXT_PUBLIC_POSTHOG_HOST` — optional; defaults to `https://us.i.posthog.com`

The integration intentionally uses manual pageviews and explicit game events:

- `autocapture: false`
- `capture_pageview: false` because the route-aware client sends `$pageview` itself
- `disable_session_recording: true`

No account identity, email, name, or other app-level PII is sent by this integration.

## Initial launch questions

The first dashboard/funnel should answer:

1. How many visitors arrive, and from which referrers/campaigns?
2. What percentage reach a game page?
3. What percentage start a game?
4. What percentage complete, game-over, or restart?
5. How often do players click a related game?
6. How often is the daily result shared?
7. Do visitors return on later days?
8. Which games drive the strongest completion, replay, cross-play, and return behavior?
