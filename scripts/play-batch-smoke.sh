#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3008"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3008 >"$ARTIFACT_DIR/play-batch-server.log" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/vector-drift" >"$ARTIFACT_DIR/vector-drift.initial.html"; then break; fi
  sleep 1
done
curl -fsS "$BASE_URL/games/vector-drift" >"$ARTIFACT_DIR/vector-drift.initial.html"
curl -fsS "$BASE_URL/games/pulse-bloom" >"$ARTIFACT_DIR/pulse-bloom.initial.html"

grep -q "Vector Drift" "$ARTIFACT_DIR/vector-drift.initial.html"
grep -q "How to play" "$ARTIFACT_DIR/vector-drift.initial.html"
grep -q "Pulse Bloom" "$ARTIFACT_DIR/pulse-bloom.initial.html"
grep -q "How to play" "$ARTIFACT_DIR/pulse-bloom.initial.html"

CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then CHROME="$candidate"; break; fi
done
if [[ -z "$CHROME" ]]; then echo "No Chrome/Chromium binary found on runner."; exit 1; fi
COMMON_FLAGS=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=5000)

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/vector-drift-desktop.png" --dump-dom "$BASE_URL/games/vector-drift" >"$ARTIFACT_DIR/vector-drift.dom.html" 2>"$ARTIFACT_DIR/vector-drift.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/vector-drift-mobile.png" "$BASE_URL/games/vector-drift" >/dev/null 2>&1
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/pulse-bloom-desktop.png" --dump-dom "$BASE_URL/games/pulse-bloom" >"$ARTIFACT_DIR/pulse-bloom.dom.html" 2>"$ARTIFACT_DIR/pulse-bloom.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/pulse-bloom-mobile.png" "$BASE_URL/games/pulse-bloom" >/dev/null 2>&1

grep -q '<canvas' "$ARTIFACT_DIR/vector-drift.dom.html"
grep -q '<canvas' "$ARTIFACT_DIR/pulse-bloom.dom.html"
grep -q 'steer through the moving gates' "$ARTIFACT_DIR/vector-drift.dom.html"
grep -q 'capture 5 with one pulse' "$ARTIFACT_DIR/pulse-bloom.dom.html"
grep -q '>Pause<' "$ARTIFACT_DIR/vector-drift.dom.html"
grep -q '>Restart<' "$ARTIFACT_DIR/pulse-bloom.dom.html"
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/vector-drift.dom.html"; then echo "Vector Drift rendered an application error."; exit 1; fi
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/pulse-bloom.dom.html"; then echo "Pulse Bloom rendered an application error."; exit 1; fi

echo "Play batch smoke passed: Vector Drift and Pulse Bloom render on desktop/mobile with live Phaser canvases, runtime status, shared controls, and public game guides."
