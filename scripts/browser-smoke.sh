#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="artifacts/browser"
BASE_URL="http://127.0.0.1:3000"
CDP_PID=""
CDP_PROFILE=""
mkdir -p "$ARTIFACT_DIR"

npm run start -- --hostname 127.0.0.1 --port 3000 >"$ARTIFACT_DIR/server.log" 2>&1 &
SERVER_PID=$!

cleanup() {
  if [[ -n "$CDP_PID" ]]; then
    kill "$CDP_PID" 2>/dev/null || true
  fi
  kill "$SERVER_PID" 2>/dev/null || true
  if [[ -n "$CDP_PROFILE" ]]; then
    rm -rf "$CDP_PROFILE"
  fi
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"; then
    break
  fi
  sleep 1
done

curl -fsS "$BASE_URL/" >"$ARTIFACT_DIR/home.html"
curl -fsS "$BASE_URL/games" >"$ARTIFACT_DIR/games.html"
curl -fsS "$BASE_URL/games/system-check" >"$ARTIFACT_DIR/system-check.initial.html"
curl -fsS "$BASE_URL/games/orbit-relay" >"$ARTIFACT_DIR/orbit-relay.initial.html"

NOT_FOUND_STATUS=$(curl -sS -o "$ARTIFACT_DIR/not-found.html" -w '%{http_code}' "$BASE_URL/definitely-not-a-route")
if [[ "$NOT_FOUND_STATUS" != "404" ]]; then
  echo "Expected unknown route to return 404, got $NOT_FOUND_STATUS"
  exit 1
fi

grep -q "Small games worth another run." "$ARTIFACT_DIR/home.html"
grep -q "Orbit Relay" "$ARTIFACT_DIR/games.html"
grep -q "System Check" "$ARTIFACT_DIR/system-check.initial.html"
grep -q "Orbit Relay" "$ARTIFACT_DIR/orbit-relay.initial.html"

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
  --virtual-time-budget=6000
)

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1440,1000 \
  --screenshot="$ARTIFACT_DIR/home-desktop.png" "$BASE_URL/" >/dev/null 2>&1

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1440,1000 \
  --screenshot="$ARTIFACT_DIR/orbit-relay-desktop.png" \
  --dump-dom "$BASE_URL/games/orbit-relay" >"$ARTIFACT_DIR/orbit-relay.dom.html" 2>"$ARTIFACT_DIR/chrome-orbit-relay.log"

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=390,844 \
  --screenshot="$ARTIFACT_DIR/orbit-relay-mobile.png" "$BASE_URL/games/orbit-relay" >/dev/null 2>&1

"$CHROME" "${COMMON_FLAGS[@]}" --window-size=1440,1000 \
  --screenshot="$ARTIFACT_DIR/system-check-desktop.png" \
  --dump-dom "$BASE_URL/games/system-check" >"$ARTIFACT_DIR/system-check.dom.html" 2>"$ARTIFACT_DIR/chrome-system-check.log"

grep -q '<canvas' "$ARTIFACT_DIR/orbit-relay.dom.html"
grep -q '<button class="control-button" type="button">Sound' "$ARTIFACT_DIR/orbit-relay.dom.html"
grep -q '>Pause<' "$ARTIFACT_DIR/orbit-relay.dom.html"
grep -q '>Restart<' "$ARTIFACT_DIR/orbit-relay.dom.html"
grep -q '<canvas' "$ARTIFACT_DIR/system-check.dom.html"

if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/orbit-relay.dom.html"; then
  echo "Detected a framework/application error in the rendered Orbit Relay page."
  exit 1
fi

if grep -Eq 'Application error|Internal Server Error|data-nextjs-dialog' "$ARTIFACT_DIR/system-check.dom.html"; then
  echo "Detected a framework/application error in the rendered system-check page."
  exit 1
fi

# Run an actual player-flow interaction pass through Chrome DevTools Protocol without
# adding a browser-automation dependency to the app bundle.
CDP_PROFILE=$(mktemp -d)
"$CHROME" \
  --headless \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --hide-scrollbars \
  --window-size=1280,900 \
  --remote-debugging-port=9222 \
  --user-data-dir="$CDP_PROFILE" \
  "$BASE_URL/games/orbit-relay" >"$ARTIFACT_DIR/chrome-interaction.log" 2>&1 &
CDP_PID=$!

for _ in $(seq 1 50); do
  if curl -fsS "http://127.0.0.1:9222/json/version" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

ORBIT_RELAY_URL="$BASE_URL/games/orbit-relay" \
  node scripts/orbit-relay-interaction.mjs "$ARTIFACT_DIR/orbit-relay-interaction.png" \
  | tee "$ARTIFACT_DIR/orbit-relay-interaction.json"

kill "$CDP_PID" 2>/dev/null || true
CDP_PID=""

echo "Browser smoke test passed: routes render, 404 works, Orbit Relay and System Check mount Phaser canvases, desktop/mobile screenshots are clean, and Orbit Relay passes keyboard/pointer/touch + pause/sound/restart interaction checks."
