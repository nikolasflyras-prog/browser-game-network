import type { GameEventName, GameEventProperties } from "@/games/_shared/types/runtime";
import {
  PLAYER_PROGRESSION_EVENT,
  applyProgressionEvent,
  progressionAwardKey,
  readProgression,
  writeProgression,
  type ProgressionUpdateDetail,
} from "@/lib/progression/playerProgression";

type PostHogClient = typeof import("posthog-js")["default"];

let clientPromise: Promise<PostHogClient | null> | null = null;
const awardedByGame = new Map<string, Set<string>>();

async function getPostHogClient(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!clientPromise) {
    clientPromise = import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
      });
      return posthog;
    });
  }

  return clientPromise;
}

function updateLocalProgression(event: GameEventName, properties: GameEventProperties) {
  if (typeof window === "undefined") return;
  const gameSlug = properties.game_slug;
  if (typeof gameSlug !== "string" || !gameSlug) return;

  if (event === "game_viewed" || event === "game_restarted") {
    awardedByGame.set(gameSlug, new Set());
  }

  const awardKey = progressionAwardKey(event, properties);
  const awarded = awardedByGame.get(gameSlug) ?? new Set<string>();
  awardedByGame.set(gameSlug, awarded);
  if (awarded.has(awardKey)) return;

  try {
    const current = readProgression(window.localStorage);
    const result = applyProgressionEvent(current, { gameSlug, event, properties });
    if (result.xpAward <= 0) return;

    awarded.add(awardKey);
    writeProgression(window.localStorage, result.state);
    const detail: ProgressionUpdateDetail = {
      state: result.state,
      unlocked: result.unlocked,
      gameSlug,
      event,
    };
    window.dispatchEvent(new CustomEvent<ProgressionUpdateDetail>(PLAYER_PROGRESSION_EVENT, { detail }));
  } catch {
    // Progression is optional and browser-local; analytics/gameplay should survive blocked storage.
  }
}

export function captureGameEvent(event: GameEventName, properties: GameEventProperties = {}): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, properties);
  }

  updateLocalProgression(event, properties);

  void getPostHogClient().then((client) => {
    client?.capture(event, properties);
  });
}

export function capturePageView(): void {
  if (typeof window === "undefined") return;

  const query = new URLSearchParams(window.location.search);
  const properties: Record<string, string | null> = {
    $current_url: window.location.href,
    $pathname: window.location.pathname,
    $referrer: document.referrer || null,
    utm_source: query.get("utm_source"),
    utm_medium: query.get("utm_medium"),
    utm_campaign: query.get("utm_campaign"),
    utm_content: query.get("utm_content"),
    utm_term: query.get("utm_term"),
  };

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] $pageview", properties);
  }

  void getPostHogClient().then((client) => {
    client?.capture("$pageview", properties);
  });
}
