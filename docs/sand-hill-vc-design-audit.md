# Sand Hill VC design audit — September 2026

## Findings

1. **The main verb was travel, not investing.** A player spent most of a five-minute session steering between fixed points. The time pressure came from crossing a floor rather than prioritizing deals and capital calls.
2. **The visual language undersold the subject.** Stick figures, desks, and circular interaction pads looked like a generic office prototype. They did not convey financing, ownership, semiconductor risk, or fund returns.
3. **Important information competed with the playfield.** The company file, alerts, portfolio book, news, and fund metrics were split across small canvas overlays. The most consequential decision could be hard to read while moving.
4. **The active file blocked other work.** The old spatial interaction path handled the carried deal before portfolio actions, even when a board call was urgent. The new desk allows simultaneous monitoring and action.
5. **Consequences needed continuity.** Company histories and queued follow-up events now make a fab delay, bridge, board plan, and round part of one investment story.

## Rework

The public route now uses three navigable first-person room scenes: an office and research hub, a deal room, and a portfolio boardroom. Players click the desk or board inside each space to inspect detailed materials, and use the corridor or room navigation to travel. The compact top row shows NAV, dry powder, TVPI/DPI, and reputation. A market wire provides context. Financing decisions expose their check size and affected resource before the player acts.

The calendar advances only when the player chooses the next week. An occupied investment file prevents opening another founder, while board calls, exits, and hiring remain available. Company histories, queued events, and fund accounting remain in use.

The room scenes now have separate compositions: a research office, a conference-based deal room, and an operations boardroom. Deal arrivals and meeting windows were retuned for week-based play, the pipeline has twelve distinct companies, and a weekly briefing lists all material arrivals, market news, and portfolio calls from the turn.

Research, deal, and board materials now open in a contextual overlay within the room viewport. The player keeps the room in sight while using the underlying simulation controls; the panel becomes a lower sheet on narrower screens.

## Remaining design work

- Deepen negotiated terms into staged checks, syndicate composition, and rival bids with explicit counteroffers.
- Give holdings a visual milestone timeline and explicit runway, yield, and customer qualification measures.
- Playtest desktop and mobile in a browser and tune density, timing, and contrast based on screenshots and real interactions.
