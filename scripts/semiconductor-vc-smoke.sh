#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3012"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3012 >"$ARTIFACT_DIR/semiconductor-vc-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/semiconductor-vc" >"$ARTIFACT_DIR/semiconductor-vc.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/games/semiconductor-vc" >"$ARTIFACT_DIR/semiconductor-vc.initial.html"
curl -fsS "$BASE_URL/semiconductors" >"$ARTIFACT_DIR/semiconductors.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-semiconductors.html"

grep -q "Sand Hill VC" "$ARTIFACT_DIR/semiconductor-vc.initial.html"
grep -q "Foundry concentration" "$ARTIFACT_DIR/semiconductor-vc.initial.html"
grep -q "Semiconductor worlds" "$ARTIFACT_DIR/semiconductors.html"
grep -q "Chip Fab" "$ARTIFACT_DIR/semiconductors.html"
grep -q "Sand Hill VC" "$ARTIFACT_DIR/semiconductors.html"
grep -q "Semiconductors" "$ARTIFACT_DIR/learn-semiconductors.html"

SEMI_VC_URL="$BASE_URL/games/semiconductor-vc" \
SEMI_VC_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/semiconductor-vc-smoke.mjs | tee "$ARTIFACT_DIR/semiconductor-vc-smoke.json"

echo "Semiconductor VC smoke passed: movement, founder meeting, diligence routing, investment committee, pause/resume, responsive rendering, and restart are verified."
