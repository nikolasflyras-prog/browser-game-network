#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3004"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3004 >"$ARTIFACT_DIR/supply-chain-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/supply-chain-shock" >"$ARTIFACT_DIR/supply-chain.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/games/supply-chain-shock" >"$ARTIFACT_DIR/supply-chain.initial.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-supply-chain.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games-supply-chain.html"

grep -q "Supply Chain Shock" "$ARTIFACT_DIR/supply-chain.initial.html"
grep -q "Supply-chain resilience" "$ARTIFACT_DIR/supply-chain.initial.html"
grep -q "Supply Chain Shock" "$ARTIFACT_DIR/learn-supply-chain.html"
grep -q "Supply Chain Shock" "$ARTIFACT_DIR/games-supply-chain.html"

SUPPLY_CHAIN_URL="$BASE_URL/games/supply-chain-shock" \
SUPPLY_CHAIN_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/supply-chain-shock-smoke.mjs | tee "$ARTIFACT_DIR/supply-chain-shock-smoke.json"

echo "Supply Chain Shock smoke test passed: public discovery, preparedness-dependent choices, metric deltas, result persistence, responsive captures, and restart are verified."
