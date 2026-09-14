# Deployment

## Intended workflow

1. Create a feature branch.
2. Push changes and run CI.
3. Use the Vercel preview deployment for browser QA.
4. Check desktop and mobile layouts, input, restart, refresh, and console/runtime errors.
5. Merge only after the preview passes.
6. Production follows `main` through Vercel Git integration.

## Environments

- **Preview:** every non-production branch/PR when Git integration is enabled.
- **Production:** `main`.

Do not commit `.vercel/` project metadata or environment secrets.

## Phase 0 acceptance test

A preview is complete when `/games/system-check`:

- loads without console/runtime errors;
- shows a responsive Phaser canvas;
- responds to click/tap and Space;
- pauses/resumes;
- restarts without duplicating canvas instances/listeners;
- preserves the local interaction best across refresh;
- records analytics only when configured.
