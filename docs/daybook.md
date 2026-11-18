# Daybook

Daybook is a hub of 32 short daily puzzles at `/daybook`, in seven categories:
Words, Numbers, Logic, Memory & speed, Knowledge, Skill and Niche. Everyone gets
the same puzzles each day, and they change at the player's local midnight.

## How it is built

Daybook is a self-contained static page, outside the App Router and the Phaser
game registry:

- `daybook/src/` holds the sources:
  - `core.js` covers storage, daily seeding, timer, history, the home page and the game shell.
  - `social.js` covers leaderboards and category averages.
  - `style.css` holds the colour tokens (light and dark) and shared styles.
  - `games/*.js` holds one file per group of games, and each calls `register({...})`.
- `python3 daybook/build.py` concatenates them into `public/daybook/index.html`.
  Commit the rebuilt file with the source change.
- `next.config.ts` rewrites `/daybook` to that file. Site navigation links to it
  with a plain `<a>`, because the page needs a full page load.
- ESLint ignores `daybook/**` and `public/daybook/**`. The sources share one script
  scope by design, so per-file lint rules don't apply.

All randomness comes from a per-day seed, so the generated puzzles are the same for
everyone. Those are the grids, mazes, boards and number puzzles. The word, quote,
fact, film and dish pools rotate through fixed lists.

## Storage

- **In the browser (`localStorage`, `daybook:*` keys):** each day's progress, results,
  times, streaks and history. The History tab can copy and restore a backup.
- **On the server (optional):** leaderboards, through `src/app/api/daybook/lb/route.ts`
  and Upstash Redis. This needs `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which Vercel's
  Storage → Upstash Redis integration sets. Without them the API returns 503, and the
  leaderboard pages say they're switched off.

The leaderboard stores one Redis hash, `daybook:lb`, with one entry per player. An
entry holds the player's nickname, today's and this week's results, totals per game,
streaks, and today's answers to the rarity games. The player id is a SHA-256 hash of
a random token kept in that browser. Scores are self-reported by the page, so the
board is not cheat-proof. Entries older than 120 days are dropped from reads, and the
hash holds at most 5,000 players.

## Privacy

Leaderboards store a nickname and game results on the server. Players can hide
themselves on the Leaderboards tab, which deletes their entry. Update the Privacy page
before switching leaderboards on in production.
