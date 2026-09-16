#!/usr/bin/env bash
set -euo pipefail
ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3009"
mkdir -p "$ARTIFACT_DIR"
npm run start -- --hostname 127.0.0.1 --port 3009 >"$ARTIFACT_DIR/play-batch-4-server.log" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 40); do if curl -fsS "$BASE_URL/games/stackline" >"$ARTIFACT_DIR/stackline.initial.html"; then break; fi; sleep 1; done
curl -fsS "$BASE_URL/games/stackline" >"$ARTIFACT_DIR/stackline.initial.html"
curl -fsS "$BASE_URL/games/switchyard" >"$ARTIFACT_DIR/switchyard.initial.html"
grep -q "Stackline" "$ARTIFACT_DIR/stackline.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/stackline.initial.html"
grep -q "Switchyard" "$ARTIFACT_DIR/switchyard.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/switchyard.initial.html"
CHROME=""; for candidate in google-chrome google-chrome-stable chromium chromium-browser; do if command -v "$candidate" >/dev/null 2>&1; then CHROME="$candidate"; break; fi; done
if [[ -z "$CHROME" ]]; then echo "No Chrome/Chromium binary found on runner."; exit 1; fi
COMMON_FLAGS=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=4500)
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/stackline-desktop.png" --dump-dom "$BASE_URL/games/stackline" >"$ARTIFACT_DIR/stackline.dom.html" 2>"$ARTIFACT_DIR/stackline.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/stackline-mobile.png" "$BASE_URL/games/stackline" >/dev/null 2>&1
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/switchyard-desktop.png" --dump-dom "$BASE_URL/games/switchyard" >"$ARTIFACT_DIR/switchyard.dom.html" 2>"$ARTIFACT_DIR/switchyard.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/switchyard-mobile.png" "$BASE_URL/games/switchyard" >/dev/null 2>&1
grep -q '<canvas' "$ARTIFACT_DIR/stackline.dom.html"; grep -q '<canvas' "$ARTIFACT_DIR/switchyard.dom.html"
grep -q '>Pause<' "$ARTIFACT_DIR/stackline.dom.html"; grep -q '>Restart<' "$ARTIFACT_DIR/switchyard.dom.html"
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/stackline.dom.html"; then echo "Stackline rendered an application error."; exit 1; fi
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/switchyard.dom.html"; then echo "Switchyard rendered an application error."; exit 1; fi
PLAY_BATCH_4_BASE_URL="$BASE_URL" node scripts/play-batch-4-interaction.mjs | tee "$ARTIFACT_DIR/play-batch-4-interaction.json"
echo "Batch 4 Play smoke passed: Stackline and Switchyard render on desktop/mobile and accept real canvas plus shared-control input."
