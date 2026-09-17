#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3016"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3016 >"$ARTIFACT_DIR/player-progression-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/progress" >"$ARTIFACT_DIR/progress.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/progress" >"$ARTIFACT_DIR/progress.initial.html"
grep -q "Player progression" "$ARTIFACT_DIR/progress.initial.html"
grep -q "Daily goals" "$ARTIFACT_DIR/progress.initial.html"

PROGRESSION_BASE_URL="$BASE_URL" \
PROGRESSION_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/player-progression-smoke.mjs | tee "$ARTIFACT_DIR/player-progression-smoke.json"

echo "Player progression smoke passed: XP, cross-game exploration, local persistence, progress hub, responsive rendering, and daily-goal state are verified."
