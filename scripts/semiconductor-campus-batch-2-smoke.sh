#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3013"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3013 >"$ARTIFACT_DIR/semiconductor-campus-batch-2-server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/chip-architect" >"$ARTIFACT_DIR/chip-architect.initial.html"; then break; fi
  sleep 1
done

curl -fsS "$BASE_URL/games/chip-architect" >"$ARTIFACT_DIR/chip-architect.initial.html"
curl -fsS "$BASE_URL/games/packaging-lab" >"$ARTIFACT_DIR/packaging-lab.initial.html"
curl -fsS "$BASE_URL/semiconductors" >"$ARTIFACT_DIR/semiconductor-campus-batch-2.html"

grep -q "Chip Architect" "$ARTIFACT_DIR/chip-architect.initial.html"
grep -q "Performance, power, and area" "$ARTIFACT_DIR/chip-architect.initial.html"
grep -q "Packaging Lab" "$ARTIFACT_DIR/packaging-lab.initial.html"
grep -q "Package warpage" "$ARTIFACT_DIR/packaging-lab.initial.html"
grep -q "Chip Architect" "$ARTIFACT_DIR/semiconductor-campus-batch-2.html"
grep -q "Packaging Lab" "$ARTIFACT_DIR/semiconductor-campus-batch-2.html"

SEMI_BATCH2_BASE_URL="$BASE_URL" SEMI_BATCH2_ARTIFACT_DIR="$ARTIFACT_DIR" node scripts/semiconductor-campus-batch-2-stable.mjs | tee "$ARTIFACT_DIR/semiconductor-campus-batch-2-smoke.json"

echo "Semiconductor campus batch 2 smoke passed: Chip Architect and Packaging Lab render, move precisely, accept spatial component placement, complete real browser workflow gates, support shared controls, and capture desktop/mobile QA."
