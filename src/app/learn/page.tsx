import Link from "next/link";

export const metadata = {
  title: "Learn",
  description: "Interactive learning games that teach through decisions, systems, and consequences rather than quizzes.",
};

export default function LearnPage() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">Learn</p>
      <h1>Interactive learning, not glorified quizzes.</h1>
      <p className="lede">The Learn side of the network will use simulations where your decisions change the system. The first planned release is Run the Fed: manage interest rates through inflation, recession, and financial shocks.</p>

      <section className="roadmap-section" aria-labelledby="learn-next-title">
        <p className="eyebrow">First simulation</p>
        <h2 id="learn-next-title">Run the Fed</h2>
        <p>Read the economy, set the policy rate, advance the quarter, and see how inflation, employment, growth, spending, investment, markets, and financial stability respond. The goal is cause and effect—not trivia.</p>
      </section>

      <div className="discovery-actions">
        <Link className="button primary" href="/games/orbit-relay">Play the current game</Link>
        <Link className="button" href="/games">Browse Play</Link>
      </div>
    </div>
  );
}
