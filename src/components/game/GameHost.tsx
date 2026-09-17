"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMetadata } from "@/games/registry";
import type { GameRuntimeController } from "@/games/_shared/types/runtime";
import { loadGameRuntime } from "@/games/loaders";
import { captureGameEvent } from "@/lib/analytics/client";
import {
  PLAYER_PROGRESSION_EVENT,
  achievementLabel,
  emptyProgression,
  masteryLevel,
  progressionLevel,
  readProgression,
  type ProgressionUpdateDetail,
} from "@/lib/progression/playerProgression";
import styles from "./GameHost.module.css";

type Props = {
  game: GameMetadata;
};

export function GameHost({ game }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameRuntimeController | null>(null);
  const mutedRef = useRef(false);
  const [status, setStatus] = useState("Loading game runtime…");
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progression, setProgression] = useState(emptyProgression);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setProgression(readProgression(window.localStorage)));
    const onProgression = (event: Event) => {
      const detail = (event as CustomEvent<ProgressionUpdateDetail>).detail;
      if (!detail) return;
      setProgression(detail.state);
      if (detail.unlocked.length > 0) {
        setUnlockNotice(`Badge unlocked · ${achievementLabel(detail.unlocked[0])}`);
      }
    };
    window.addEventListener(PLAYER_PROGRESSION_EVENT, onProgression);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PLAYER_PROGRESSION_EVENT, onProgression);
    };
  }, []);

  useEffect(() => {
    if (!unlockNotice) return;
    const timer = window.setTimeout(() => setUnlockNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [unlockNotice]);

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
          emit: (event, properties) => {
            const eventProperties = properties ?? {};
            mountElement.dataset.gameLastEvent = event;
            mountElement.dataset.gameLastProperties = JSON.stringify(eventProperties);
            captureGameEvent(event, {
              game_slug: game.slug,
              game_version: game.version,
              ...eventProperties,
            });
          },
        });
        controller.setMuted?.(mutedRef.current);
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
  }, [game.slug, game.version]);

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
      mutedRef.current = next;
      controllerRef.current?.setMuted?.(next);
      return next;
    });
  }, []);

  const gameMastery = progression.mastery[game.slug]?.xp ?? 0;
  const exploredLabel = progression.playedGames.length === 1 ? "game explored" : "games explored";
  const badgeLabel = progression.achievements.length === 1 ? "badge" : "badges";

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
      <div
        className={styles.progressionStrip}
        data-player-level={progressionLevel(progression.xp)}
        data-player-xp={progression.xp}
        data-game-mastery={gameMastery}
      >
        <span className={styles.primary}>Network Lv {progressionLevel(progression.xp)} · {progression.xp} XP</span>
        <span>{game.title} mastery Lv {masteryLevel(gameMastery)}</span>
        <span>{progression.playedGames.length} {exploredLabel} · {progression.achievements.length} {badgeLabel}</span>
        {unlockNotice ? <strong className={styles.unlock} aria-live="polite">{unlockNotice}</strong> : null}
      </div>
      {error ? <div className="game-error">{error}</div> : null}
      <div ref={mountRef} className="game-canvas-mount" />
    </section>
  );
}
