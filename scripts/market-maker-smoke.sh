#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3003"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3003 >"$ARTIFACT_DIR/market-maker-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/market-maker" >"$ARTIFACT_DIR/market-maker.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/games/market-maker" >"$ARTIFACT_DIR/market-maker.initial.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-market-maker.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games-market-maker.html"

grep -q "Market Maker" "$ARTIFACT_DIR/market-maker.initial.html"
grep -q "Bid-ask spread" "$ARTIFACT_DIR/market-maker.initial.html"
grep -q "Market Maker" "$ARTIFACT_DIR/learn-market-maker.html"
grep -q "Market Maker" "$ARTIFACT_DIR/games-market-maker.html"

MARKET_MAKER_URL="$BASE_URL/games/market-maker" \
MARKET_MAKER_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/market-maker-smoke.mjs | tee "$ARTIFACT_DIR/market-maker-smoke.json"

echo "Market Maker smoke test passed: public discovery, 16-round completion, result explanation, local best-score persistence, responsive result capture, and restart are verified."
