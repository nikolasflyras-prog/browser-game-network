#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3005"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3005 >"$ARTIFACT_DIR/chip-fab-server.log" 2>&1 &
SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/chip-fab" >"$ARTIFACT_DIR/chip-fab.initial.html"; then break; fi
  sleep 1
done

curl -fsS "$BASE_URL/games/chip-fab" >"$ARTIFACT_DIR/chip-fab.initial.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-chip-fab.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games-chip-fab.html"
grep -q "Chip Fab" "$ARTIFACT_DIR/chip-fab.initial.html"
grep -q "Semiconductor yield" "$ARTIFACT_DIR/chip-fab.initial.html"
grep -q "Chip Fab" "$ARTIFACT_DIR/learn-chip-fab.html"
grep -q "Chip Fab" "$ARTIFACT_DIR/games-chip-fab.html"

CHIP_FAB_URL="$BASE_URL/games/chip-fab" CHIP_FAB_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/chip-fab-smoke.mjs | tee "$ARTIFACT_DIR/chip-fab-smoke.json"

echo "Chip Fab smoke passed: public discovery, utilization-vs-good-output lesson, persistence, responsive result captures, and restart are verified."
