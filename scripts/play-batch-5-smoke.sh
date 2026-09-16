#!/usr/bin/env bash
set -euo pipefail
ARTIFACT_DIR="artifacts/browser"; BASE_URL="http://127.0.0.1:3010"; mkdir -p "$ARTIFACT_DIR"
npm run start -- --hostname 127.0.0.1 --port 3010 >"$ARTIFACT_DIR/play-batch-5-server.log" 2>&1 & SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; }; trap cleanup EXIT
for _ in $(seq 1 40); do if curl -fsS "$BASE_URL/games/rebound-rush" >"$ARTIFACT_DIR/rebound-rush.initial.html"; then break; fi; sleep 1; done
curl -fsS "$BASE_URL/games/rebound-rush" >"$ARTIFACT_DIR/rebound-rush.initial.html"; curl -fsS "$BASE_URL/games/railflip" >"$ARTIFACT_DIR/railflip.initial.html"
grep -q "Rebound Rush" "$ARTIFACT_DIR/rebound-rush.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/rebound-rush.initial.html"; grep -q "Railflip" "$ARTIFACT_DIR/railflip.initial.html"; grep -q "How to play" "$ARTIFACT_DIR/railflip.initial.html"
CHROME=""; for candidate in google-chrome google-chrome-stable chromium chromium-browser; do if command -v "$candidate" >/dev/null 2>&1; then CHROME="$candidate"; break; fi; done; if [[ -z "$CHROME" ]]; then echo "No Chrome/Chromium binary found."; exit 1; fi
COMMON=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=4500)
"$CHROME" "${COMMON[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/rebound-rush-desktop.png" --dump-dom "$BASE_URL/games/rebound-rush" >"$ARTIFACT_DIR/rebound-rush.dom.html" 2>"$ARTIFACT_DIR/rebound-rush.chrome.log"; "$CHROME" "${COMMON[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/rebound-rush-mobile.png" "$BASE_URL/games/rebound-rush" >/dev/null 2>&1
"$CHROME" "${COMMON[@]}" --window-size=1280,900 --screenshot="$ARTIFACT_DIR/railflip-desktop.png" --dump-dom "$BASE_URL/games/railflip" >"$ARTIFACT_DIR/railflip.dom.html" 2>"$ARTIFACT_DIR/railflip.chrome.log"; "$CHROME" "${COMMON[@]}" --window-size=390,844 --screenshot="$ARTIFACT_DIR/railflip-mobile.png" "$BASE_URL/games/railflip" >/dev/null 2>&1
grep -q '<canvas' "$ARTIFACT_DIR/rebound-rush.dom.html"; grep -q '<canvas' "$ARTIFACT_DIR/railflip.dom.html"; grep -q '>Pause<' "$ARTIFACT_DIR/rebound-rush.dom.html"; grep -q '>Restart<' "$ARTIFACT_DIR/railflip.dom.html"
if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/rebound-rush.dom.html"; then exit 1; fi; if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/railflip.dom.html"; then exit 1; fi
PLAY_BATCH_5_BASE_URL="$BASE_URL" node scripts/play-batch-5-interaction.mjs | tee "$ARTIFACT_DIR/play-batch-5-interaction.json"
echo "Batch 5 Play smoke passed: Rebound Rush and Railflip render on desktop/mobile and accept real canvas/shared-control input."
