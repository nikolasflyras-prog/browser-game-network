#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3006"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3006 >"$ARTIFACT_DIR/power-grid-server.log" 2>&1 &
SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/power-grid-dispatcher" >"$ARTIFACT_DIR/power-grid.initial.html"; then break; fi
  sleep 1
done

curl -fsS "$BASE_URL/games/power-grid-dispatcher" >"$ARTIFACT_DIR/power-grid.initial.html"
curl -fsS "$BASE_URL/learn" >"$ARTIFACT_DIR/learn-power-grid.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games-power-grid.html"
grep -q "Power Grid Dispatcher" "$ARTIFACT_DIR/power-grid.initial.html"
grep -q "Grid reliability" "$ARTIFACT_DIR/power-grid.initial.html"
grep -q "Power Grid Dispatcher" "$ARTIFACT_DIR/learn-power-grid.html"
grep -q "Power Grid Dispatcher" "$ARTIFACT_DIR/games-power-grid.html"

POWER_GRID_URL="$BASE_URL/games/power-grid-dispatcher" POWER_GRID_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/power-grid-smoke.mjs | tee "$ARTIFACT_DIR/power-grid-smoke.json"

echo "Power Grid smoke passed: public discovery, finite-storage optionality lesson, locked/preserved heatwave responses, persistence, responsive result captures, and restart are verified."
