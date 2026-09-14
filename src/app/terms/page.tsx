import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Browser Game Network and its browser games and educational simulations.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="page-shell compact">
      <section className="catalog-intro">
        <p className="eyebrow">Terms</p>
        <h1>Terms of use.</h1>
        <p className="lede">Effective September 14, 2026.</p>
      </section>

      <section className="content-section">
        <h2>Using the site</h2>
        <p>
          Browser Game Network provides browser games, puzzles, and interactive simulations for entertainment and educational use. You may use the site for ordinary personal or educational purposes, subject to these terms and applicable law.
        </p>
      </section>

      <section className="content-section">
        <h2>Educational simulations are simplified</h2>
        <p>
          Simulations such as Run the Fed are teaching tools. They simplify real systems so cause and effect can be explored through decisions. They are not forecasts, professional advice, investment recommendations, accounting advice, legal advice, or representations of how any real institution will act.
        </p>
      </section>

      <section className="content-section">
        <h2>Availability and changes</h2>
        <p>
          Games and features may be changed, reset, removed, or temporarily unavailable. Local scores and progress can also be lost if browser storage is cleared or unavailable. The service is provided on an as-available basis without a promise that every feature will remain unchanged.
        </p>
      </section>

      <section className="content-section">
        <h2>Acceptable use</h2>
        <p>
          Do not use the site to interfere with its operation, attempt unauthorized access, distribute malicious software, automate abusive traffic, or violate the rights of others. Reasonable experimentation with the games themselves is welcome.
        </p>
      </section>

      <section className="content-section">
        <h2>Content and software</h2>
        <p>
          Site text, game designs, artwork, and software may be protected by intellectual-property rights. A public source-code repository does not by itself grant rights beyond any license or notice that applies to the relevant material.
        </p>
      </section>

      <section className="content-section">
        <h2>Changes to these terms</h2>
        <p>
          These terms may be updated as the network adds features or changes how it operates. The effective date above will be updated when the terms change materially.
        </p>
      </section>
    </div>
  );
}
