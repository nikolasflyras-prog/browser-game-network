# Deployment

## Intended workflow

1. Create a feature branch from `main`.
2. Accumulate a coherent batch of changes before advancing the deployed branch ref.
3. Run CI on the coherent revision.
4. Use one Vercel preview for browser QA when the batch is large enough to justify a build.
5. Check desktop/mobile layouts, controls, restart/reset paths, refresh/persistence, console/runtime errors, and affected SEO routes.
6. Merge only after GitHub CI is green.
7. Production follows `main` through Vercel Git integration.
8. After production is ready, run `docs/launch.md` before inviting traffic.

## Quota-conserving agent batching

When an automated coding session is making many incremental edits, do **not** advance a Vercel-connected branch for every logical commit.

The repository can safely accumulate Git tree/commit objects while leaving the branch ref at the last deployed revision:

1. Build a new Git tree from the current batch head.
2. Create a commit whose parent is the previous internal batch commit.
3. Continue chaining commits without updating the Vercel-connected branch ref.
4. Confirm the unattached commit has no Vercel deployment status.
5. Once the work forms a coherent QA-worthy batch, move the branch ref to the internal head **once**.
6. That ref movement becomes the single preview deployment for the accumulated batch.

This is a temporary batching technique, not long-term storage. Do not leave important work only in unattached commits indefinitely; attach the batch to a normal branch when the batch is ready for CI/preview or before ending a workstream.

## Environments

- **Preview:** non-production branches/PRs when Git integration creates a build.
- **Production:** `main`.

Do not commit `.vercel/` project metadata or environment secrets.

## Ignored Vercel builds

`vercel.json` attempts to skip a Vercel build when the only changes since the previous successful deployment are in:

- `docs/**`;
- `README.md`;
- `.env.example`;
- `.github/**`.

Vercel `ignoreCommand` uses exit code `0` to ignore a build and exit code `1` to continue it. If the previous SHA is unavailable, the configured guard deliberately allows the build rather than risk skipping real application changes.

Any game, application, UI, configuration, package, public asset, or runtime-script change therefore still requests a normal build once its branch ref advances.

## Production environment variables

Analytics is optional. Gameplay must remain functional if these are absent.

```text
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Only set the key after the public Privacy page is live. Confirm the host matches the PostHog project region.

## CI acceptance gates

A pull request is not ready to merge until repository CI passes:

- lint;
- TypeScript checking;
- unit tests for game/simulation logic;
- optimized Next.js production build;
- browser smoke and screenshot checks;
- real Orbit Relay interaction/capture regression;
- real Linebreak Daily solve/persistence/streak/share regression;
- Run the Fed eight-quarter interaction/persistence regression;
- SEO checks for sitemap, robots, canonicals, public game content, trust/legal pages, and diagnostic noindex.

Future-game lab code must also keep its deterministic balance and integration-adapter tests green before any candidate is promoted.

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

During rapid iteration, Git-triggered previews can hit account-level build-rate limits. A rate-limit status is an infrastructure throttle, not proof that the application build failed.

When throttled or preserving quota:

- do not create no-op commits or repeated redeploy attempts;
- continue logic/docs work without advancing a deployed branch ref;
- batch related code so the next preview represents a meaningful QA checkpoint;
- use ignored-build rules for documentation-only changes where possible;
- once a preview is intentionally created, test that revision thoroughly before spending another build;
- move to an appropriate commercial plan before monetized/public-commercial operation if required by platform terms and expected deployment volume.

## Diagnostic route

`/games/system-check` remains an engineering surface for validating the shared runtime. It is not a public product game and must stay out of site discovery and search indexing.
