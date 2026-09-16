#!/usr/bin/env bash
set -euo pipefail
ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3011"
mkdir -p "$ARTIFACT_DIR"
npm run start -- --hostname 127.0.0.1 --port 3011 >"$ARTIFACT_DIR/play-batch-6-server.log" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 40); do if curl -fsS "$BASE_URL/games/courier-loop" >"$ARTIFACT_DIR/courier-loop.initial.html"; then break; fi; sleep 1; done
curl -fsS "$BASE_URL/games/courier-loop" >"$ARTIFACT_DIR/courier-loop.initial.html"
curl -fsS "$BASE_URL/games/magnet-field" >"$ARTIFACT_DIR/magnet-field.initial.html"
grep -q "Courier Loop" "$ARTIFACT_DIR/courier-loop.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/courier-loop.initial.html"
grep -q "Magnet Field" "$ARTIFACT_DIR/magnet-field.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/magnet-field.initial.html"
CHROME=""; for candidate in google-chrome google-chrome-stable chromium chromium-browser; do if command -v "$candidate" >/dev/null 2>&1; then CHROME="$candidate"; break; fi; done
if [[ -z "$CHROME" ]]; then echo "No Chrome/Chromium binary found on runner."; exit 1; fi
COMMON_FLAGS=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=4500)
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/courier-loop-desktop.png" --dump-dom "$BASE_URL/games/courier-loop" >"$ARTIFACT_DIR/courier-loop.dom.html" 2>"$ARTIFACT_DIR/courier-loop.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/courier-loop-mobile.png" "$BASE_URL/games/courier-loop" >/dev/null 2>&1
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/magnet-field-desktop.png" --dump-dom "$BASE_URL/games/magnet-field" >"$ARTIFACT_DIR/magnet-field.dom.html" 2>"$ARTIFACT_DIR/magnet-field.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/magnet-field-mobile.png" "$BASE_URL/games/magnet-field" >/dev/null 2>&1
grep -q '<canvas' "$ARTIFACT_DIR/courier-loop.dom.html"; grep -q '<canvas' "$ARTIFACT_DIR/magnet-field.dom.html"
grep -q '>Pause<' "$ARTIFACT_DIR/courier-loop.dom.html"; grep -q '>Restart<' "$ARTIFACT_DIR/magnet-field.dom.html"
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/courier-loop.dom.html"; then echo "Courier Loop rendered an application error."; exit 1; fi
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/magnet-field.dom.html"; then echo "Magnet Field rendered an application error."; exit 1; fi
PLAY_BATCH_6_BASE_URL="$BASE_URL" node scripts/play-batch-6-stable.mjs | tee "$ARTIFACT_DIR/play-batch-6-interaction.json"
echo "Batch 6 Play smoke passed: Courier Loop and Magnet Field render desktop/mobile, accept real movement, drain field energy correctly, and prove pause stops and resume restarts simulation."
