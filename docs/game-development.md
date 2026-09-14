# Game Development Workflow

Every game should move through the same sequence:

1. Define the fantasy, primary verbs, core loop, win/loss/reset states.
2. Score the idea against development difficulty, replayability, distribution, mobile fit, education, monetization, differentiation, and expansion potential.
3. Prototype the mechanic with temporary graphics.
4. Playtest before visual polish.
5. Keep simulation rules outside Phaser scene callbacks.
6. Add desktop and touch input mappings.
7. Integrate shared pause/results/settings/storage/analytics surfaces.
8. Add game-specific visual identity and optimized assets.
9. Test the actual rendered experience, not only the build output.
10. Add a useful landing page, metadata, instructions, and related games.
11. Deploy a preview, inspect it, then promote/merge.
12. Measure and either iterate, expand, or kill the idea.

## New-game directory

```text
src/games/<slug>/
  runtime.ts        # Phaser/render integration
  simulation/       # rules and serializable state
  assets.ts         # stable manifest keys
  README.md         # core loop and implementation notes
```

Not every tiny game needs every directory on day one. Add structure only when it contains real code.

## Anti-patterns

- giant Phaser scene files containing all business/game rules;
- React state mirrored frame-by-frame from Phaser;
- dense menus rendered into canvas for convenience;
- hard-coded asset paths throughout gameplay systems;
- account creation before play;
- building backend features before a game proves demand;
- treating a successful `next build` as a gameplay QA pass.
