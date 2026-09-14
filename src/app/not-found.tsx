import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell compact">
      <p className="eyebrow">404</p>
      <h1>That route missed.</h1>
      <p className="lede">The page is gone or never existed. You can get straight back into a playable game instead.</p>
      <div className="discovery-actions">
        <Link className="button primary" href="/games/orbit-relay">Play Orbit Relay</Link>
        <Link className="button" href="/games">Browse games</Link>
        <Link className="text-link" href="/">Home →</Link>
      </div>
    </div>
  );
}
