# Game Identity Matrix

Every new game can share the network's movement, pause, analytics, save, and responsive runtime infrastructure. It must not share the same gameplay identity.

## Release rule

Before a game is considered ready, it must differ materially from adjacent games across at least four of these six dimensions:

1. **Core verb** — what the player does repeatedly.
2. **Pacing** — reflex, planning, building, optimization, exploration, survival, etc.
3. **Spatial structure** — open floor, rooms, production line, grid, world map, construction site, scrolling field, etc.
4. **Primary resource** — inventory, capital, time, power, staff, throughput, reputation, physical objects, etc.
5. **Failure pressure** — missed orders, drawdown, yield loss, thermal failure, backlog, collision, deadline, etc.
6. **Progression** — waves, projects, portfolio growth, factory expansion, staff development, tech unlocks, score chase, etc.

Movement is a control scheme, not a gameplay loop. A game fails this test if its experience can be summarized as "walk to a highlighted station, press E, then walk to the next highlighted station" without a distinct system evolving underneath the player.

## Finance Worlds

| Game | Core verb | Pacing | Spatial structure | Primary resource | Failure pressure | Progression |
| --- | --- | --- | --- | --- | --- | --- |
| Market Maker | Pick up, route, execute, hedge client flow | Fast / reflexive | Dense trading floor with client desks and execution venues | Inventory + reputation | Expiring orders, adverse price moves, rejected fills | More client flow and harder market shocks until closing bell |
| Hedge Fund Floor | Research, form a thesis, construct a portfolio, allocate staff, manage risk and LPs | Deliberate / managerial | Investment office with research, portfolio, risk and LP functions | NAV + research confidence + operating budget + staff | Drawdown, concentration/beta risk, poor research, LP confidence | Better research process, larger/cleaner book, stronger team and fund score |
| Run the Fed | Set policy and absorb macro tradeoffs | Turn-based / strategic | Policy dashboard / timeline | Inflation-employment-growth balance | Macro instability | Eight-quarter policy path |

### Market Maker guardrails

- Keep it about **execution**, not security selection.
- Client orders should be urgent and physical.
- Venue choice, fill probability, spread capture and inventory are the main decisions.
- Speed and routing skill should matter.
- Do not add staff hiring, company diligence, LP management or long-form research.

### Hedge Fund Floor guardrails

- Keep it about **investment process and portfolio management**, not order routing.
- Research quality and thesis direction should matter more than reaction speed.
- Staff should change the operating system of the fund: analysts improve research, traders lower implementation cost, risk staff reduce uncontrolled exposure.
- LP updates, drawdown, portfolio beta and gross/net exposure should create medium-horizon pressure.
- The office should visually read as distinct functional rooms/teams, not three execution venues on another trading floor.
- Future iteration should replace simple long/short interaction pads with a richer portfolio-construction or investment-committee interaction rather than copying Market Maker's venue loop.

## Semiconductor Worlds

The same rule applies to the semiconductor collection:

- **Sand Hill VC:** founder meetings, diligence, IC, reserves, portfolio support.
- **Chip Architect:** physical floorplanning, PPA/timing tradeoffs, verification, tapeout.
- **Packaging Lab:** die/HBM/I/O placement, bonding, thermals, yield, inspection.
- **Fab Floor:** WIP flow, bottlenecks, maintenance, yield and cycle time.
- **Data Center Architect:** rack placement, fabric topology, power/cooling, workload SLA.

They may all use a movable character, but the system being manipulated must remain fundamentally different.
