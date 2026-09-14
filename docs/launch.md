# Beta Launch Checklist

## Current product state

Browser Game Network has reached the three-game MVP that was defined before implementation:

- **Orbit Relay** — replay/infrastructure test.
- **Linebreak Daily** — daily-return, streak, and sharing test.
- **Run the Fed** — educational simulation and search-demand test.

The site also has public game guides, sitemap/robots/canonical metadata, About/Privacy/Terms pages, local progress persistence, explicit game analytics events, and route-level pageview attribution.

**Do not start Game #4 until the first-user data is reviewed.** The next product decision should come from observed behavior, not the idea backlog.

## External launch prerequisites

Before sending meaningful traffic:

- [ ] Vercel production is built from the current `main` commit.
- [ ] Production root URL loads without Vercel authentication or framework errors.
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` is configured in production if analytics is being activated.
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` points to the correct PostHog region/project host.
- [ ] Privacy page is live before analytics collection is enabled.
- [ ] A real production event is visible in PostHog before traffic is invited.
- [ ] Search Console can be connected once the production hostname/domain is final.

PostHog is optional for the app to run. A missing analytics key must never break gameplay.

## Production route QA

Verify these routes after every production release:

- [ ] `/`
- [ ] `/games`
- [ ] `/learn`
- [ ] `/daily`
- [ ] `/games/orbit-relay`
- [ ] `/games/linebreak-daily`
- [ ] `/games/run-the-fed`
- [ ] `/about`
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/sitemap.xml`
- [ ] `/robots.txt`

`/games/system-check` may remain reachable as an engineering diagnostic, but it must stay out of public discovery, the sitemap, and search indexing.

## Game QA

### Orbit Relay

- [ ] Canvas mounts on desktop and mobile.
- [ ] Pointer/touch input works.
- [ ] Space input works on keyboard.
- [ ] Capture and miss/game-over paths both work.
- [ ] Pause/resume works.
- [ ] Restart does not duplicate the canvas or listeners.
- [ ] Local high score survives refresh.

### Linebreak Daily

- [ ] The date deterministically selects the same puzzle for all players.
- [ ] Pointer/touch route input works.
- [ ] Key must be collected before the gate.
- [ ] Hazards and ink limit enforce correctly.
- [ ] A completed daily result persists locally.
- [ ] Current streak updates correctly.
- [ ] Share/copy result works after completion.

### Run the Fed

- [ ] Policy-rate controls work.
- [ ] Simulation advances through all eight quarters.
- [ ] Shock/explanation content renders.
- [ ] Final score and grade render.
- [ ] Best result persists locally.
- [ ] Mobile layout remains usable without horizontal overflow.

## Measurement contract

The first beta should answer these questions:

1. How many visitors actually start a game?
2. Which games get completed versus abandoned?
3. Which games cause an immediate replay?
4. How often does a player try a second game in the same visit?
5. Does Linebreak create next-day return behavior?
6. Do players share Linebreak results?
7. Does Run the Fed attract meaningful organic/search traffic?
8. Which acquisition sources send players who actually play rather than bounce?

Core events:

- `$pageview`
- `game_viewed`
- `game_started`
- `game_completed`
- `game_over`
- `game_restarted`
- `daily_started`
- `daily_completed`
- `share_clicked`
- `related_game_clicked`

Do not add high-frequency movement or frame-level analytics.

## Initial beta sequence

1. Deploy current `main` and run the full production QA above.
2. Confirm analytics with a small set of test visits.
3. Invite a small known cohort first and watch for obvious confusion/regressions.
4. Expand to genuine users through friends/classes, relevant communities, social clips, and direct sharing.
5. Use **100 genuine users** as the initial internal experiment threshold for the first funnel review. This is a project threshold, not an industry benchmark.
6. Review starts, completion, replay, second-game clicks, return behavior, source quality, and qualitative feedback.
7. Fix the weakest part of the funnel before adding another game.

## Launch decision rule

A technically successful deployment is not enough. The beta is successful only when the team can identify which game/mechanic/distribution path deserves the next development cycle using actual player behavior.

If the data is inconclusive, improve instrumentation or distribution before expanding the catalog.
