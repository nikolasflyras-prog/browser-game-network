import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About Browser Game Network: fast browser games and interactive simulations designed around replay, decisions, and clear systems.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="page-shell compact">
      <section className="catalog-intro">
        <p className="eyebrow">About</p>
        <h1>Games first. Learning through systems.</h1>
        <p className="lede">
          Browser Game Network is a small collection of fast browser games and interactive simulations. The goal is simple: open a page, understand what to do quickly, and have a reason to play another round.
        </p>
      </section>

      <section className="content-section">
        <h2>Two lanes, one network</h2>
        <p>
          <strong>Play</strong> focuses on short-session entertainment built around timing, puzzles, strategy, and replay. <strong>Learn</strong> uses simulations instead of quizzes so concepts emerge from decisions and consequences.
        </p>
        <p>
          The educational games are simplified teaching models. They are designed to make cause and effect easier to see, not to reproduce every detail of the real systems they represent.
        </p>
      </section>

      <section className="content-section">
        <h2>Built for a fast start</h2>
        <p>
          No account is required to play. Where a game saves a score, streak, or daily result, the initial versions keep that progress locally in your browser.
        </p>
        <div className="page-actions">
          <Link className="button primary" href="/games">Browse games</Link>
          <Link className="button" href="/learn">Try a simulation</Link>
        </div>
      </section>
    </div>
  );
}
