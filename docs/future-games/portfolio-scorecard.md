# Future Game Portfolio Scorecard

Scale: 1–5, where 5 is strongest. `Build` is inverse difficulty: 5 = fastest/easiest to ship well. Weighted total emphasizes replayability, mobile fit, and the ability to teach or entertain without backend complexity.

| Candidate | Lane | Build | Replay | Mobile | Distribution | Learning | Monetization fit | Differentiation | Expansion | Weighted / 100 | Recommendation |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Traffic Control | PLAY | 5 | 5 | 5 | 4 | 1 | 5 | 3 | 4 | 84 | Best next PLAY prototype |
| Market Maker | LEARN | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 91 | Best next LEARN prototype |
| Supply Chain Shock | LEARN | 4 | 4 | 4 | 5 | 5 | 4 | 4 | 5 | 86 | Strong SEO/course expansion |
| Chip Fab | LEARN | 3 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 84 | High differentiation, niche audience |
| Portfolio Panic | LEARN | 5 | 4 | 5 | 5 | 4 | 4 | 3 | 4 | 83 | Easy finance follow-on |
| Signal Stack | PLAY | 4 | 4 | 5 | 3 | 2 | 5 | 3 | 4 | 77 | Hold unless daily puzzle demand is strong |
| Headline Trader | LEARN | 3 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | 82 | Needs content pipeline; avoid before demand |
| Startup Runway | LEARN | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 5 | 85 | Strong later management sim |

## Weighting

- Build speed: 15%
- Replayability: 20%
- Mobile fit: 15%
- Distribution/SEO/shareability: 15%
- Learning value: 10%
- Monetization fit: 10%
- Differentiation: 10%
- Expansion potential: 5%

## Decision tree after beta

### PLAY signal wins
Choose **Traffic Control** if Orbit Relay produces the best replay/restart behavior. It is mechanically distinct but preserves the short-session, instant-restart loop. Avoid building another timing-orbit game.

If Linebreak Daily instead wins because of daily return/share behavior, do not automatically promote Traffic Control. Prototype a daily layer around a distinct mechanic first and compare it with Signal Stack.

### LEARN signal wins
Choose **Market Maker** if Run the Fed proves users will complete interactive educational simulations. It is faster, more tactile, and better suited to repeat sessions than another long-form macro simulation.

Choose **Supply Chain Shock** if search traffic and classroom-style discovery are stronger than replay. It opens operations/supply-chain keywords and maps naturally to business-school coursework.

Choose **Chip Fab** only if differentiated technical education appears valuable enough to justify a narrower audience. It can become a flagship specialist game later.

## Portfolio guardrails

- Do not let the LEARN lane become a collection of disguised multiple-choice quizzes.
- Do not let the PLAY lane become reskins of Orbit Relay or Linebreak Daily.
- Every new public game should test one new product hypothesis.
- Reuse shell, analytics, storage, pause/results/settings, input mapping, and deterministic simulation patterns.
- Keep initial sessions below roughly five minutes unless the game specifically proves longer-session demand.
- Reserve interstitial ad opportunities for results/restart transitions, never active decision windows.