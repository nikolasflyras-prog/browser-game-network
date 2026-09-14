# Phase 0 QA Checklist

Use this checklist on every preview before merging game-runtime changes.

## Build gates

- lint passes
- TypeScript passes
- unit tests pass
- production build passes

## Browser checks

- homepage loads without console errors
- `/games/system-check` mounts exactly one Phaser canvas
- click/tap moves the diagnostic marker
- Space moves the diagnostic marker
- Pause stops scene activity and Resume restores it
- Restart resets the current run without duplicating listeners/canvases
- refresh preserves the local best value
- narrow/mobile viewport remains usable without controls overlapping the playfield
- navigation among Play, Learn, and Daily remains functional

## Runtime hygiene

- leaving the game route destroys the Phaser instance
- no high-frequency analytics events are emitted
- no secrets are present in client code
- PostHog remains optional when no public key is configured
