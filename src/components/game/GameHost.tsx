"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMetadata } from "@/games/registry";
import type { GameRuntimeController } from "@/games/_shared/types/runtime";
import { loadGameRuntime } from "@/games/loaders";
import { captureGameEvent } from "@/lib/analytics/client";

type Props = {
  game: GameMetadata;
};

export function GameHost({ game }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameRuntimeController | null>(null);
  const [status, setStatus] = useState("Loading game runtime…");
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;

    captureGameEvent("game_viewed", {
      game_slug: game.slug,
      game_version: game.version,
    });

    async function start(mountElement: HTMLElement) {
      try {
        const runtime = await loadGameRuntime(game.slug);
        if (cancelled) return;
        const controller = await runtime.mountGame(mountElement, {
          gameSlug: game.slug,
          gameVersion: game.version,
          setStatus,
          emit: (event, properties) =>
            captureGameEvent(event, {
              game_slug: game.slug,
              game_version: game.version,
              ...properties,
            }),
        });
        controller.setMuted?.(muted);
        controllerRef.current = controller;
      } catch (cause) {
        console.error(cause);
        setError(cause instanceof Error ? cause.message : "The game runtime failed to load.");
      }
    }

    void start(mount);

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [game.slug, game.version, muted]);

  const togglePause = useCallback(() => {
    if (!controllerRef.current) return;
    if (paused) {
      controllerRef.current.resume();
      setPaused(false);
      captureGameEvent("game_resumed", { game_slug: game.slug, game_version: game.version });
    } else {
      controllerRef.current.pause();
      setPaused(true);
      captureGameEvent("game_paused", { game_slug: game.slug, game_version: game.version });
    }
  }, [game.slug, game.version, paused]);

  const restart = useCallback(() => {
    controllerRef.current?.restart();
    setPaused(false);
    captureGameEvent("game_restarted", { game_slug: game.slug, game_version: game.version });
  }, [game.slug, game.version]);

  const toggleSound = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      controllerRef.current?.setMuted?.(next);
      return next;
    });
  }, []);

  return (
    <section className="game-shell" aria-label={`${game.title} game`}>
      <div className="game-toolbar">
        <span className="game-status" aria-live="polite">{error ? "Runtime error" : status}</span>
        <div className="game-controls">
          <button className="control-button" type="button" onClick={toggleSound} disabled={Boolean(error)}>
            Sound {muted ? "off" : "on"}
          </button>
          <button className="control-button" type="button" onClick={togglePause} disabled={Boolean(error)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button className="control-button" type="button" onClick={restart} disabled={Boolean(error)}>
            Restart
          </button>
        </div>
      </div>
      {error ? <div className="game-error">{error}</div> : null}
      <div ref={mountRef} className="game-canvas-mount" />
    </section>
  );
}
