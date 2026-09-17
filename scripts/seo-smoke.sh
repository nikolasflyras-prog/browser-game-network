#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/seo"
BASE_URL="http://127.0.0.1:3002"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3002 >"$ARTIFACT_DIR/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"; then break; fi
  sleep 1
done

curl -fsSI "$BASE_URL/" >"$ARTIFACT_DIR/home.headers"
curl -fsS "$BASE_URL/sitemap.xml" >"$ARTIFACT_DIR/sitemap.xml"
curl -fsS "$BASE_URL/robots.txt" >"$ARTIFACT_DIR/robots.txt"
curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"
curl -fsS "$BASE_URL/about" >"$ARTIFACT_DIR/about.html"
curl -fsS "$BASE_URL/privacy" >"$ARTIFACT_DIR/privacy.html"
curl -fsS "$BASE_URL/terms" >"$ARTIFACT_DIR/terms.html"
curl -fsS "$BASE_URL/semiconductors" >"$ARTIFACT_DIR/semiconductors.html"
for page in orbit-relay linebreak-daily run-the-fed market-maker semiconductor-vc chip-architect packaging-lab supply-chain-shock chip-fab power-grid-dispatcher system-check; do
  curl -fsS "$BASE_URL/games/$page" >"$ARTIFACT_DIR/$page.html"
done

for path in games/orbit-relay games/linebreak-daily games/run-the-fed games/market-maker games/semiconductor-vc games/chip-architect games/packaging-lab games/supply-chain-shock games/chip-fab games/power-grid-dispatcher semiconductors about privacy terms; do
  grep -q "https://browser-game-network.vercel.app/$path" "$ARTIFACT_DIR/sitemap.xml"
done
if grep -q "system-check" "$ARTIFACT_DIR/sitemap.xml"; then echo "Diagnostic System Check leaked into the public sitemap."; exit 1; fi

grep -qi '^x-content-type-options: nosniff' "$ARTIFACT_DIR/home.headers"
grep -qi '^referrer-policy: strict-origin-when-cross-origin' "$ARTIFACT_DIR/home.headers"
grep -qi '^permissions-policy: camera=(), microphone=(), geolocation=()' "$ARTIFACT_DIR/home.headers"
grep -q "Sitemap: https://browser-game-network.vercel.app/sitemap.xml" "$ARTIFACT_DIR/robots.txt"
grep -q "Disallow: /games/system-check" "$ARTIFACT_DIR/robots.txt"

for path in about privacy terms semiconductors; do grep -q "rel=\"canonical\" href=\"https://browser-game-network.vercel.app/$path\"" "$ARTIFACT_DIR/$path.html"; done
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app"' "$ARTIFACT_DIR/home.html"
for page in orbit-relay linebreak-daily run-the-fed market-maker semiconductor-vc chip-architect packaging-lab supply-chain-shock chip-fab power-grid-dispatcher; do
  grep -q "rel=\"canonical\" href=\"https://browser-game-network.vercel.app/games/$page\"" "$ARTIFACT_DIR/$page.html"
  grep -q 'application/ld+json' "$ARTIFACT_DIR/$page.html"
  grep -q 'Frequently asked questions' "$ARTIFACT_DIR/$page.html"
  grep -q 'Strategy' "$ARTIFACT_DIR/$page.html"
done

grep -q 'Bid-ask spread' "$ARTIFACT_DIR/market-maker.html"
grep -q 'Foundry concentration' "$ARTIFACT_DIR/semiconductor-vc.html"
grep -q 'Performance, power, and area' "$ARTIFACT_DIR/chip-architect.html"
grep -q 'Package warpage' "$ARTIFACT_DIR/packaging-lab.html"
grep -q 'Chip Architect' "$ARTIFACT_DIR/semiconductors.html"
grep -q 'Packaging Lab' "$ARTIFACT_DIR/semiconductors.html"
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
for href in /games /learn /semiconductors /daily /about /privacy /terms; do grep -q "href=\"$href\"" "$ARTIFACT_DIR/home.html"; done

grep -q 'content="noindex, nofollow"' "$ARTIFACT_DIR/system-check.html"
if grep -q 'application/ld+json' "$ARTIFACT_DIR/system-check.html"; then echo "Diagnostic System Check unexpectedly received public structured data."; exit 1; fi

echo "SEO smoke passed: public sitemap, expanded Semiconductors campus, canonicals, security headers, structured game guides, trust/legal pages, navigation, and diagnostic noindex are all present."
