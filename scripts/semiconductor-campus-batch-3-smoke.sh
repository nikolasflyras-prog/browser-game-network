#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3014"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3014 >"$ARTIFACT_DIR/semiconductor-campus-batch-3-server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/fab-floor" >"$ARTIFACT_DIR/fab-floor.initial.html"; then break; fi
  sleep 1
done

curl -fsS "$BASE_URL/games/fab-floor" >"$ARTIFACT_DIR/fab-floor.initial.html"
curl -fsS "$BASE_URL/games/data-center-architect" >"$ARTIFACT_DIR/data-center-architect.initial.html"
curl -fsS "$BASE_URL/semiconductors" >"$ARTIFACT_DIR/semiconductor-campus-batch-3.html"

grep -q "Fab Floor" "$ARTIFACT_DIR/fab-floor.initial.html"
grep -q "Work in process" "$ARTIFACT_DIR/fab-floor.initial.html"
grep -q "Data Center Architect" "$ARTIFACT_DIR/data-center-architect.initial.html"
grep -q "800G fabrics" "$ARTIFACT_DIR/data-center-architect.initial.html"
grep -q "Fab Floor" "$ARTIFACT_DIR/semiconductor-campus-batch-3.html"
grep -q "Data Center Architect" "$ARTIFACT_DIR/semiconductor-campus-batch-3.html"

SEMI_BATCH3_BASE_URL="$BASE_URL" SEMI_BATCH3_ARTIFACT_DIR="$ARTIFACT_DIR" node scripts/semiconductor-campus-batch-3-stable.mjs | tee "$ARTIFACT_DIR/semiconductor-campus-batch-3-smoke.json"

echo "Semiconductor campus batch 3 smoke passed: Fab Floor and Data Center Architect render desktop/mobile, accept real movement, complete physical workflow gates, and use bounded mobile cameras."
