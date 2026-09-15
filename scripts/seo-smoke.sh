#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/seo"
BASE_URL="http://127.0.0.1:3002"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3002 >"$ARTIFACT_DIR/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"; then
    break
  fi
  sleep 1
done

curl -fsSI "$BASE_URL/" >"$ARTIFACT_DIR/home.headers"
curl -fsS "$BASE_URL/sitemap.xml" >"$ARTIFACT_DIR/sitemap.xml"
curl -fsS "$BASE_URL/robots.txt" >"$ARTIFACT_DIR/robots.txt"
curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"
curl -fsS "$BASE_URL/about" >"$ARTIFACT_DIR/about.html"
curl -fsS "$BASE_URL/privacy" >"$ARTIFACT_DIR/privacy.html"
curl -fsS "$BASE_URL/terms" >"$ARTIFACT_DIR/terms.html"
curl -fsS "$BASE_URL/games/orbit-relay" >"$ARTIFACT_DIR/orbit-relay.html"
curl -fsS "$BASE_URL/games/linebreak-daily" >"$ARTIFACT_DIR/linebreak-daily.html"
curl -fsS "$BASE_URL/games/traffic-control" >"$ARTIFACT_DIR/traffic-control.html"
curl -fsS "$BASE_URL/games/run-the-fed" >"$ARTIFACT_DIR/run-the-fed.html"
curl -fsS "$BASE_URL/games/market-maker" >"$ARTIFACT_DIR/market-maker.html"
curl -fsS "$BASE_URL/games/supply-chain-shock" >"$ARTIFACT_DIR/supply-chain-shock.html"
curl -fsS "$BASE_URL/games/chip-fab" >"$ARTIFACT_DIR/chip-fab.html"
curl -fsS "$BASE_URL/games/power-grid-dispatcher" >"$ARTIFACT_DIR/power-grid-dispatcher.html"
curl -fsS "$BASE_URL/games/system-check" >"$ARTIFACT_DIR/system-check.html"

for path in games/orbit-relay games/linebreak-daily games/traffic-control games/run-the-fed games/market-maker games/supply-chain-shock games/chip-fab games/power-grid-dispatcher about privacy terms; do
  grep -q "https://browser-game-network.vercel.app/$path" "$ARTIFACT_DIR/sitemap.xml"
done

if grep -q "system-check" "$ARTIFACT_DIR/sitemap.xml"; then
  echo "Diagnostic System Check leaked into the public sitemap."
  exit 1
fi

grep -qi '^x-content-type-options: nosniff' "$ARTIFACT_DIR/home.headers"
grep -qi '^referrer-policy: strict-origin-when-cross-origin' "$ARTIFACT_DIR/home.headers"
grep -qi '^permissions-policy: camera=(), microphone=(), geolocation=()' "$ARTIFACT_DIR/home.headers"

grep -q "Sitemap: https://browser-game-network.vercel.app/sitemap.xml" "$ARTIFACT_DIR/robots.txt"
grep -q "Disallow: /games/system-check" "$ARTIFACT_DIR/robots.txt"

grep -q 'rel="canonical" href="https://browser-game-network.vercel.app"' "$ARTIFACT_DIR/home.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/about"' "$ARTIFACT_DIR/about.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/privacy"' "$ARTIFACT_DIR/privacy.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/terms"' "$ARTIFACT_DIR/terms.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/orbit-relay"' "$ARTIFACT_DIR/orbit-relay.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/linebreak-daily"' "$ARTIFACT_DIR/linebreak-daily.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/traffic-control"' "$ARTIFACT_DIR/traffic-control.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/run-the-fed"' "$ARTIFACT_DIR/run-the-fed.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/market-maker"' "$ARTIFACT_DIR/market-maker.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/supply-chain-shock"' "$ARTIFACT_DIR/supply-chain-shock.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/chip-fab"' "$ARTIFACT_DIR/chip-fab.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/power-grid-dispatcher"' "$ARTIFACT_DIR/power-grid-dispatcher.html"

for page in orbit-relay linebreak-daily traffic-control run-the-fed market-maker supply-chain-shock chip-fab power-grid-dispatcher; do
  grep -q 'application/ld+json' "$ARTIFACT_DIR/$page.html"
  grep -q 'Frequently asked questions' "$ARTIFACT_DIR/$page.html"
  grep -q 'Strategy' "$ARTIFACT_DIR/$page.html"
done

grep -q 'Queue management' "$ARTIFACT_DIR/traffic-control.html"
grep -q 'Signal timing' "$ARTIFACT_DIR/traffic-control.html"
grep -q 'Bid-ask spread' "$ARTIFACT_DIR/market-maker.html"
grep -q 'Supply-chain resilience' "$ARTIFACT_DIR/supply-chain-shock.html"
grep -q 'Path dependence' "$ARTIFACT_DIR/supply-chain-shock.html"
grep -q 'Semiconductor yield' "$ARTIFACT_DIR/chip-fab.html"
grep -q 'Bottleneck utilization' "$ARTIFACT_DIR/chip-fab.html"
grep -q 'Grid reliability' "$ARTIFACT_DIR/power-grid-dispatcher.html"
grep -q 'Energy storage dispatch' "$ARTIFACT_DIR/power-grid-dispatcher.html"
grep -q 'Games first. Learning through systems.' "$ARTIFACT_DIR/about.html"
grep -q 'Small games. Minimal data.' "$ARTIFACT_DIR/privacy.html"
grep -q 'Automatic click tracking and session replay are disabled' "$ARTIFACT_DIR/privacy.html"
grep -q 'Educational simulations are simplified' "$ARTIFACT_DIR/terms.html"

for href in /games /learn /daily /about /privacy /terms; do
  grep -q "href=\"$href\"" "$ARTIFACT_DIR/home.html"
done

grep -q 'content="noindex, nofollow"' "$ARTIFACT_DIR/system-check.html"

if grep -q 'application/ld+json' "$ARTIFACT_DIR/system-check.html"; then
  echo "Diagnostic System Check unexpectedly received public structured data."
  exit 1
fi

echo "SEO smoke test passed: public sitemap, robots rules, canonicals, security headers, structured data for eight public games including Traffic Control, trust/legal pages, footer navigation, and diagnostic noindex are all present."
