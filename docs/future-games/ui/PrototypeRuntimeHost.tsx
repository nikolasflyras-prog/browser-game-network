"use client";

import { useEffect, useRef, useState } from "react";
import type { GameBridge, GameEventName, GameEventProperties, GameRuntimeController } from "@/games/_shared/types/runtime";
import styles from "./FutureGameLab.module.css";

type RuntimeMount = (mount: HTMLElement, bridge: GameBridge) => GameRuntimeController;

type Props = {
  slug: string;
  title: string;
  loadRuntime: () => Promise<RuntimeMount>;
};

export function PrototypeRuntimeHost({ slug, title, loadRuntime }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GameRuntimeController | null>(null);
  const [status, setStatus] = useState("Loading staged runtime…");
  const [latestEvent, setLatestEvent] = useState<string>("No event yet");
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;

    async function start(mountElement: HTMLElement) {
      try {
        const mountGame = await loadRuntime();
        if (cancelled) return;
        const emit = (event: GameEventName, properties: GameEventProperties = {}) => {
          const detail = Object.entries(properties)
            .slice(0, 3)
            .map(([key, value]) => `${key}=${String(value)}`)
            .join(" · ");
          setLatestEvent(detail ? `${event} · ${detail}` : event);
        };
        controllerRef.current = mountGame(mountElement, {
          gameSlug: slug,
          gameVersion: "lab",
          emit,
          setStatus,
        });
      } catch (cause) {
        console.error(cause);
        setError(cause instanceof Error ? cause.message : "Staged runtime failed to load.");
      }
    }

    void start(mount);
    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [loadRuntime, slug]);

  function togglePause() {
    const controller = controllerRef.current;
    if (!controller) return;
    if (paused) {
      controller.resume();
      setPaused(false);
    } else {
      controller.pause();
      setPaused(true);
    }
  }

  function restart() {
    controllerRef.current?.restart();
    setPaused(false);
  }

  return (
    <section className={styles.runtimeShell} aria-label={`${title} staged runtime`}>
      <div className={styles.runtimeToolbar}>
        <div>
          <strong>{title}</strong>
          <span>{error ?? status}</span>
        </div>
        <div className={styles.runtimeControls}>
          <button type="button" onClick={togglePause} disabled={Boolean(error)}>{paused ? "Resume" : "Pause"}</button>
          <button type="button" onClick={restart} disabled={Boolean(error)}>Restart</button>
        </div>
      </div>
      <div ref={mountRef} className={styles.runtimeMount} />
      <p className={styles.eventReadout} aria-live="polite"><strong>Latest event:</strong> {latestEvent}</p>
    </section>
  );
}
