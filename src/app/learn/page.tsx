import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Interactive Learning Games",
  description: "Learn economics, finance, business, and other systems through interactive browser simulations rather than quizzes.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Interactive Learning Games",
    description: "Learn economics, finance, business, and other systems through interactive browser simulations rather than quizzes.",
    url: "/learn",
  },
};

export default function LearnPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Learn</p>
      <h1>Learn by running the system.</h1>
      <p className="lede">
        The learning side of the network is built around simulations: make a decision, watch the system respond, and understand why the outcome changed.
      </p>

      <section className="roadmap-panel" aria-labelledby="learn-live-heading">
        <div>
          <span className="status-chip">Playable prototype</span>
          <h2 id="learn-live-heading">Run the Fed</h2>
          <p>
            Set interest rates across eight quarters and balance inflation, unemployment, growth, investment, asset prices, and financial stability as economic shocks arrive.
          </p>
        </div>
        <p className="roadmap-note">No quiz loop. The lesson is the cause-and-effect model itself, with an explanation after every policy decision.</p>
      </section>

      <div className="page-actions">
        <Link className="button primary" href="/games/run-the-fed">
          Run the simulation
        </Link>
        <Link className="button" href="/games">
          Browse all games
        </Link>
      </div>
    </div>
  );
}
