#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3015"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3015 >"$ARTIFACT_DIR/hedge-fund-floor-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/hedge-fund-floor" >"$ARTIFACT_DIR/hedge-fund-floor.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/games/hedge-fund-floor" >"$ARTIFACT_DIR/hedge-fund-floor.initial.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-hedge-fund.html"

grep -q "Hedge Fund HQ" "$ARTIFACT_DIR/hedge-fund-floor.initial.html"
grep -q "Gross versus net exposure" "$ARTIFACT_DIR/hedge-fund-floor.initial.html"
grep -q "Hedge Fund HQ" "$ARTIFACT_DIR/learn-hedge-fund.html"

HEDGE_FUND_BASE_URL="$BASE_URL" \
HEDGE_FUND_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/hedge-fund-floor-stable.mjs | tee "$ARTIFACT_DIR/hedge-fund-floor-smoke.json"

echo "Hedge Fund HQ smoke passed: movement, research, live position creation, beta hedging, staff hiring, responsive rendering, pause/resume, and restart are verified."
