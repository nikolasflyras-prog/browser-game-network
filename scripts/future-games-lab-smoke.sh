#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3010"
TARGET_URL="$BASE_URL/lab/future-games"
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3010 >"$ARTIFACT_DIR/future-games-server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$TARGET_URL" >"$ARTIFACT_DIR/future-games-lab.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$TARGET_URL" >"$ARTIFACT_DIR/future-games-lab.html"
grep -q "Future Games Lab" "$ARTIFACT_DIR/future-games-lab.html"
grep -qi "noindex" "$ARTIFACT_DIR/future-games-lab.html"

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

COMMON_FLAGS=(
  --headless
  --no-sandbox
  --disable-gpu
  --disable-dev-shm-usage
  --hide-scrollbars
  --virtual-time-budget=7000
)

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1440,1100 \
  --screenshot="$ARTIFACT_DIR/future-games-lab-desktop.png" "$TARGET_URL" >/dev/null 2>&1

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 \
  --screenshot="$ARTIFACT_DIR/future-games-lab-mobile.png" "$TARGET_URL" >/dev/null 2>&1

FUTURE_GAMES_LAB_URL="$TARGET_URL" node scripts/future-games-lab-smoke.mjs \
  | tee "$ARTIFACT_DIR/future-games-lab-smoke.json"

echo "Future Games Lab smoke test passed: six staged prototypes render, representative decisions execute, screenshots are captured, and the lab remains noindex/unlinked from public game routes."
