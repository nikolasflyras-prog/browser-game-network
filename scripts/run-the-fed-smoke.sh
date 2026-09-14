#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3001"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3001 >"$ARTIFACT_DIR/fed-server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/games/run-the-fed" >"$ARTIFACT_DIR/run-the-fed.initial.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/games/run-the-fed" >"$ARTIFACT_DIR/run-the-fed.initial.html"
grep -q "Run the Fed" "$ARTIFACT_DIR/run-the-fed.initial.html"
grep -q "What you are learning" "$ARTIFACT_DIR/run-the-fed.initial.html"

CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$candidate"
    break
  fi
done

if [[ -z "$CHROME" ]]; then
  echo "No Chrome/Chromium binary found on runner."
  exit 1
fi

COMMON_FLAGS=(--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --hide-scrollbars --virtual-time-budget=6000)

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1440,1100 \
  --screenshot="$ARTIFACT_DIR/run-the-fed-desktop.png" \
  --dump-dom "$BASE_URL/games/run-the-fed" >"$ARTIFACT_DIR/run-the-fed.dom.html" 2>"$ARTIFACT_DIR/chrome-run-the-fed.log"

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 \
  --screenshot="$ARTIFACT_DIR/run-the-fed-mobile.png" "$BASE_URL/games/run-the-fed" >/dev/null 2>&1

grep -q "Set the policy rate" "$ARTIFACT_DIR/run-the-fed.dom.html"
grep -q "Advance quarter" "$ARTIFACT_DIR/run-the-fed.dom.html"
grep -q "Financial stability" "$ARTIFACT_DIR/run-the-fed.dom.html"

if grep -q '<canvas' "$ARTIFACT_DIR/run-the-fed.dom.html"; then
  echo "Run the Fed should remain DOM-first, but a canvas was rendered."
  exit 1
fi

if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/run-the-fed.dom.html"; then
  echo "Detected an application error in Run the Fed."
  exit 1
fi

echo "Run the Fed smoke test passed."
