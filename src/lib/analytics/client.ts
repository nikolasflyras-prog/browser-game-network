import type { GameEventName, GameEventProperties } from "@/games/_shared/types/runtime";

type PostHogClient = typeof import("posthog-js")["default"];

let clientPromise: Promise<PostHogClient | null> | null = null;

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
      });
      return posthog;
    });
  }

  return clientPromise;
}

export function captureGameEvent(event: GameEventName, properties: GameEventProperties = {}): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, properties);
  }

  void getPostHogClient().then((client) => {
    client?.capture(event, properties);
  });
}
