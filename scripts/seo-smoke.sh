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

curl -fsS "$BASE_URL/sitemap.xml" >"$ARTIFACT_DIR/sitemap.xml"
curl -fsS "$BASE_URL/robots.txt" >"$ARTIFACT_DIR/robots.txt"
curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"
curl -fsS "$BASE_URL/games/orbit-relay" >"$ARTIFACT_DIR/orbit-relay.html"
curl -fsS "$BASE_URL/games/linebreak-daily" >"$ARTIFACT_DIR/linebreak-daily.html"
curl -fsS "$BASE_URL/games/run-the-fed" >"$ARTIFACT_DIR/run-the-fed.html"
curl -fsS "$BASE_URL/games/system-check" >"$ARTIFACT_DIR/system-check.html"

for slug in orbit-relay linebreak-daily run-the-fed; do
  grep -q "https://browser-game-network.vercel.app/games/$slug" "$ARTIFACT_DIR/sitemap.xml"
done

if grep -q "system-check" "$ARTIFACT_DIR/sitemap.xml"; then
  echo "Diagnostic System Check leaked into the public sitemap."
  exit 1
fi

grep -q "Sitemap: https://browser-game-network.vercel.app/sitemap.xml" "$ARTIFACT_DIR/robots.txt"
grep -q "Disallow: /games/system-check" "$ARTIFACT_DIR/robots.txt"

grep -q 'rel="canonical" href="https://browser-game-network.vercel.app"' "$ARTIFACT_DIR/home.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/orbit-relay"' "$ARTIFACT_DIR/orbit-relay.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/linebreak-daily"' "$ARTIFACT_DIR/linebreak-daily.html"
grep -q 'rel="canonical" href="https://browser-game-network.vercel.app/games/run-the-fed"' "$ARTIFACT_DIR/run-the-fed.html"

for page in orbit-relay linebreak-daily run-the-fed; do
  grep -q 'application/ld+json' "$ARTIFACT_DIR/$page.html"
  grep -q 'Frequently asked questions' "$ARTIFACT_DIR/$page.html"
  grep -q 'Strategy' "$ARTIFACT_DIR/$page.html"
done

grep -q 'content="noindex, nofollow"' "$ARTIFACT_DIR/system-check.html"

if grep -q 'application/ld+json' "$ARTIFACT_DIR/system-check.html"; then
  echo "Diagnostic System Check unexpectedly received public structured data."
  exit 1
fi

echo "SEO smoke test passed: public sitemap, production robots rules, route canonicals, game JSON-LD, substantive guide content, and diagnostic noindex are all present."
