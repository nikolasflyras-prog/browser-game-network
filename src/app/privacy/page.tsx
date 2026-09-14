import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for Browser Game Network, including local game progress and optional anonymous product analytics.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="page-shell compact">
      <section className="catalog-intro">
        <p className="eyebrow">Privacy</p>
        <h1>Small games. Minimal data.</h1>
        <p className="lede">Effective September 14, 2026.</p>
      </section>

      <section className="content-section">
        <h2>What the site stores</h2>
        <p>
          Browser Game Network does not require an account to play. Some games store progress such as high scores, daily completions, streaks, or simulation best scores in your browser&apos;s local storage. That information stays on the device and browser where you played unless a future feature clearly says otherwise.
        </p>
      </section>

      <section className="content-section">
        <h2>Product analytics</h2>
        <p>
          The site can use PostHog for anonymous product analytics. When analytics is enabled, events may include page visits, game starts and completions, scores, restarts, daily completions, share-button use, related-game clicks, referral information, and campaign parameters. The current integration does not intentionally send names, email addresses, account profiles, or the contents of anything you type into a game.
        </p>
        <p>
          Automatic click tracking and session replay are disabled in the current analytics configuration. Analytics may use browser storage or similar identifiers to distinguish visits and understand return behavior.
        </p>
      </section>

      <section className="content-section">
        <h2>Advertising</h2>
        <p>
          The site does not currently display third-party advertising. If advertising is introduced, this notice will be updated to describe the providers and data practices that apply before those systems become part of the normal experience.
        </p>
      </section>

      <section className="content-section">
        <h2>Your browser controls</h2>
        <p>
          You can remove locally saved game progress by clearing this site&apos;s storage in your browser. Blocking or clearing browser storage may also affect saved scores, streaks, and analytics identifiers.
        </p>
      </section>

      <section className="content-section">
        <h2>Changes</h2>
        <p>
          This policy may change as the site adds features such as accounts, leaderboards, classroom tools, or advertising. The effective date above will be updated when the policy changes materially.
        </p>
      </section>
    </div>
  );
}
