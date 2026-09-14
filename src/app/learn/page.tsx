import Link from "next/link";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Learn</p>
      <h1>Learn by running the system.</h1>
      <p className="lede">
        The learning side of the network is built around simulations: make a decision, watch the system respond, and understand why the outcome changed.
      </p>

      <section className="roadmap-panel" aria-labelledby="learn-next-heading">
        <div>
          <span className="status-chip">Planned</span>
          <h2 id="learn-next-heading">Run the Fed</h2>
          <p>
            Set interest rates across changing economic conditions and see how inflation, unemployment, growth, investment, and financial stability react over time.
          </p>
        </div>
        <p className="roadmap-note">No quiz loop. The lesson is the cause-and-effect model itself.</p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/orbit-relay">
          Play what is live now
        </Link>
        <Link className="button" href="/games">
          Browse games
        </Link>
      </div>
    </div>
  );
}
