#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3007"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3007 >"$ARTIFACT_DIR/traffic-control-server.log" 2>&1 &
SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/traffic-control" >"$ARTIFACT_DIR/traffic-control.initial.html"; then break; fi
  sleep 1
done

curl -fsS "$BASE_URL/games/traffic-control" >"$ARTIFACT_DIR/traffic-control.initial.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games-traffic-control.html"
grep -q "Traffic Control" "$ARTIFACT_DIR/traffic-control.initial.html"
grep -q "Queue management" "$ARTIFACT_DIR/traffic-control.initial.html"
grep -q "Traffic Control" "$ARTIFACT_DIR/games-traffic-control.html"

TRAFFIC_CONTROL_URL="$BASE_URL/games/traffic-control" TRAFFIC_CONTROL_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/traffic-control-smoke.mjs | tee "$ARTIFACT_DIR/traffic-control-smoke.json"

echo "Traffic Control smoke passed: public discovery, real pointer/keyboard switching, pause/sound/restart controls, deterministic gridlock, persistence, and responsive screenshots are verified."
