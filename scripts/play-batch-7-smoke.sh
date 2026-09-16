#!/usr/bin/env bash
set -euo pipefail
ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3012"
mkdir -p "$ARTIFACT_DIR"
npm run start -- --hostname 127.0.0.1 --port 3012 >"$ARTIFACT_DIR/play-batch-7-server.log" 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 40); do if curl -fsS "$BASE_URL/games/skybound" >"$ARTIFACT_DIR/skybound.initial.html"; then break; fi; sleep 1; done
curl -fsS "$BASE_URL/games/skybound" >"$ARTIFACT_DIR/skybound.initial.html"; curl -fsS "$BASE_URL/games/circuit-coil" >"$ARTIFACT_DIR/circuit-coil.initial.html"
grep -q "Skybound" "$ARTIFACT_DIR/skybound.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/skybound.initial.html"; grep -q "Circuit Coil" "$ARTIFACT_DIR/circuit-coil.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/circuit-coil.initial.html"
CHROME=""; for candidate in google-chrome google-chrome-stable chromium chromium-browser; do if command -v "$candidate" >/dev/null 2>&1; then CHROME="$candidate"; break; fi; done
if [[ -z "$CHROME" ]]; then echo "No Chrome/Chromium binary found on runner."; exit 1; fi
COMMON_FLAGS=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=4500)
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/skybound-desktop.png" --dump-dom "$BASE_URL/games/skybound" >"$ARTIFACT_DIR/skybound.dom.html" 2>"$ARTIFACT_DIR/skybound.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/skybound-mobile.png" "$BASE_URL/games/skybound" >/dev/null 2>&1
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/circuit-coil-desktop.png" --dump-dom "$BASE_URL/games/circuit-coil" >"$ARTIFACT_DIR/circuit-coil.dom.html" 2>"$ARTIFACT_DIR/circuit-coil.chrome.log"
"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/circuit-coil-mobile.png" "$BASE_URL/games/circuit-coil" >/dev/null 2>&1
grep -q '<canvas' "$ARTIFACT_DIR/skybound.dom.html"; grep -q '<canvas' "$ARTIFACT_DIR/circuit-coil.dom.html"
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/skybound.dom.html"; then echo "Skybound rendered an application error."; exit 1; fi
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/circuit-coil.dom.html"; then echo "Circuit Coil rendered an application error."; exit 1; fi
PLAY_BATCH_7_BASE_URL="$BASE_URL" node scripts/play-batch-7-interaction.mjs | tee "$ARTIFACT_DIR/play-batch-7-interaction.json"
echo "Batch 7 Play smoke passed: Skybound and Circuit Coil render desktop/mobile and pass real movement/turn/shared-control QA."
