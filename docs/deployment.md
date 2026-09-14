# Deployment

## Intended workflow

1. Create a feature branch from `main`.
2. Push a coherent batch of changes and run CI.
3. Use the Vercel preview deployment for browser QA when the account build quota permits it.
4. Check desktop and mobile layouts, controls, restart/reset paths, refresh/persistence, console/runtime errors, and affected SEO routes.
5. Merge only after GitHub CI is green.
6. Production follows `main` through Vercel Git integration.
7. After production is ready, run the production checklist in `docs/launch.md` before inviting traffic.

## Environments

- **Preview:** non-production branches/PRs when Git integration can create a build.
- **Production:** `main`.

Do not commit `.vercel/` project metadata or environment secrets.

## Ignored Vercel builds

`vercel.json` skips a Vercel build when the only changes since the previous successful deployment are in:

- `docs/**`;
- `README.md`;
- `.env.example`;
- `.github/**`.

Vercel documents `ignoreCommand` so exit code `0` ignores the build and exit code `1` continues it. The configured command uses `VERCEL_GIT_PREVIOUS_SHA` and performs a Git diff that excludes only the documentation/CI paths above. If the previous SHA is unavailable, it deliberately exits `1` so the build proceeds rather than being skipped accidentally.

Any game, application, UI, configuration, package, public asset, or runtime-script change therefore still requests a normal preview/production build.

## Production environment variables

Analytics is optional. Gameplay must remain functional if these are absent.

```text
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Only set the key after the public Privacy page is live. Confirm the host matches the PostHog project region.

## CI acceptance gates

A pull request is not ready to merge until the repository CI passes:

- lint;
- TypeScript checking;
- unit tests for game/simulation logic;
- optimized Next.js production build;
- browser smoke and screenshot checks;
- real Orbit Relay interaction/capture regression;
- real Linebreak Daily solve/persistence/streak/share regression;
- Run the Fed eight-quarter interaction/persistence regression;
- SEO checks for sitemap, robots, canonicals, public game content, trust/legal pages, and diagnostic noindex.

## Production acceptance test

After a new production revision becomes available:

1. Confirm `/`, `/games`, `/learn`, and `/daily` load.
2. Play one complete interaction path in all three public games.
3. Confirm About, Privacy, and Terms load from the footer.
4. Confirm `/sitemap.xml` includes the three public games and trust/legal pages.
5. Confirm `/robots.txt` blocks `/games/system-check` and references the sitemap.
6. Confirm `/games/system-check` remains noindex and absent from public discovery.
7. Check desktop and mobile layouts.
8. Check for framework/console errors.
9. If analytics is configured, verify one `$pageview` and one `game_started` event in PostHog.
10. Only then invite beta traffic.

## Deployment throttling

The current project is hosted under a Vercel Hobby team. During rapid iteration, Git-triggered preview/production builds can hit account-level build-rate limits. A rate-limit status is an infrastructure throttle, not proof that the application build failed.

When throttled:

- do not repeatedly create no-op commits or redeploy attempts;
- continue code/QA work behind GitHub CI;
- batch changes so the next allowed Vercel build carries a meaningful revision;
- rely on the ignored-build guard for documentation-only changes;
- once the quota resets, verify the first successful production build against `docs/launch.md`;
- move to an appropriate commercial Vercel plan before monetized/public-commercial operation if required by the platform terms and expected deployment volume.

## Diagnostic route

`/games/system-check` remains an engineering surface for validating the shared runtime. It is not a public product game and must stay out of site discovery and search indexing.
