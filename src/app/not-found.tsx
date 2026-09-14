import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell compact not-found-page">
      <p className="eyebrow">404</p>
      <h1>That route missed the target.</h1>
      <p className="lede">The page is not here, but the playable parts of the network are one click away.</p>
      <div className="page-actions">
        <Link className="button primary" href="/games/orbit-relay">
          Play Orbit Relay
        </Link>
        <Link className="button" href="/games">
          Back to games
        </Link>
      </div>
    </div>
  );
}
