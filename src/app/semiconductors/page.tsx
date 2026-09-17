import type { Metadata } from "next";
import Link from "next/link";
import { GameCard } from "@/components/catalog/GameCard";
import { publicGameRegistry } from "@/games/registry";

export const metadata: Metadata = {
  title: "Semiconductor Games",
  description: "Learn semiconductors by moving through venture, chip-design, fab, packaging, and data-center systems.",
  alternates: { canonical: "/semiconductors" },
  openGraph: {
    title: "Semiconductor Games",
    description: "Playable semiconductor worlds for venture, manufacturing, chip design, packaging, and infrastructure.",
    url: "/semiconductors",
  },
};

export default function SemiconductorsPage() {
  const semiconductorGames = publicGameRegistry.filter((game) => game.collection === "Semiconductors");

  return (
    <div className="page-shell">
      <section className="catalog-intro">
        <p className="eyebrow">Semiconductors</p>
        <h1>Learn the stack by operating it.</h1>
        <p className="lede">
          Move through semiconductor businesses and infrastructure instead of reading a glossary.
          Invest in chip companies, architect silicon, run wafer fabrication, assemble advanced packages,
          and build the data-center systems that finally consume the chips.
        </p>
      </section>

      <section aria-labelledby="semi-games-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Playable now</p>
            <h2 id="semi-games-heading">Semiconductor worlds</h2>
          </div>
          <span className="catalog-count">{semiconductorGames.length} live</span>
        </div>
        <div className="game-grid">
          {semiconductorGames.map((game) => <GameCard game={game} key={game.slug} />)}
        </div>
      </section>

      <section className="roadmap-panel" aria-labelledby="semi-roadmap-heading">
        <div>
          <span className="status-chip">Semiconductor campus</span>
          <h2 id="semi-roadmap-heading">From capital to floorplan to fab to package to data hall.</h2>
          <p>
            Sand Hill VC covers company formation and investing. Chip Architect turns PPA, timing, IP selection,
            and tapeout into a spatial design problem. Fab Floor makes wafer starts, WIP, bottlenecks, tool health,
            and maintenance physical. Packaging Lab covers HBM adjacency, chiplets, thermals, warpage, yield, and inspection.
            Data Center Architect closes the loop with compute, network, power, cooling, storage, and live SLA failures.
          </p>
        </div>
        <p className="roadmap-note">
          The next expansion targets optical I/O / photonics and a deeper foundry economics world.
          The standard remains movement first: the technical lesson should emerge from operating the environment.
        </p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/fab-floor">Enter Fab Floor</Link>
        <Link className="button" href="/games/data-center-architect">Enter Data Center Architect</Link>
        <Link className="button" href="/games/chip-architect">Enter Chip Architect</Link>
        <Link className="button" href="/learn">Back to Learn</Link>
      </div>
    </div>
  );
}
