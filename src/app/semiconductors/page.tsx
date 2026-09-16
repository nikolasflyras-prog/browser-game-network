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
          Invest in chip companies, run manufacturing systems, and learn how design, foundries,
          packaging, equipment, memory, optics, and data centers fit together.
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
          <h2 id="semi-roadmap-heading">One stack, several playable jobs.</h2>
          <p>
            Sand Hill VC teaches company formation, financing, technical diligence, foundry risk,
            design wins, NRE, customer concentration, portfolio construction, and follow-ons.
            The next worlds expand down the stack rather than turning the same lesson into another menu.
          </p>
        </div>
        <p className="roadmap-note">
          Next environments: Chip Architect, Fab Floor, Packaging Lab, and Data Center Architect.
          Each will use the same movement-first interaction standard.
        </p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/semiconductor-vc">Enter Sand Hill VC</Link>
        <Link className="button" href="/learn">Back to Learn</Link>
      </div>
    </div>
  );
}
