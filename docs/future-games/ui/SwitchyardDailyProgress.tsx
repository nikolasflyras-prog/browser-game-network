"use client";

import { useEffect, useState } from "react";
import { listLocalGameValues } from "@/games/_shared/storage/localGameStorage";
import {
  activeSwitchyardDailyStreak,
  formatSwitchyardDailyShare,
  switchyardUtcDateKey,
  type StoredSwitchyardDailyResult,
} from "../switchyard-daily/daily";
import styles from "./SwitchyardDailyProgress.module.css";

const GAME_SLUG = "switchyard-daily";
const SAVE_VERSION = 1;

type ProgressSnapshot = {
  todayResult: StoredSwitchyardDailyResult | null;
  streak: number;
  signature: string;
};

const EMPTY_SNAPSHOT: ProgressSnapshot = { todayResult: null, streak: 0, signature: "" };

function readSnapshot(): ProgressSnapshot {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  const todayKey = switchyardUtcDateKey();
  const records = listLocalGameValues<StoredSwitchyardDailyResult>(GAME_SLUG, "daily-", SAVE_VERSION);
  const wonDates = records
    .filter((record) => record.value.won)
    .map((record) => record.name.slice("daily-".length))
    .filter((dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
    .sort();
  const todayResult = records.find((record) => record.name === `daily-${todayKey}`)?.value ?? null;
  return {
    todayResult,
    streak: activeSwitchyardDailyStreak(wonDates, todayKey),
    signature: `${wonDates.join(",")}|${todayResult?.score ?? ""}|${todayResult?.strikes ?? ""}|${todayResult?.won ?? ""}`,
  };
}

function legacyCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function SwitchyardDailyProgress() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(EMPTY_SNAPSHOT);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const todayKey = switchyardUtcDateKey();

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active) return;
      const next = readSnapshot();
      setSnapshot((current) => current.signature === next.signature && current.streak === next.streak ? current : next);
    };
    const kickoff = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 350);
    return () => {
      active = false;
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, []);

  async function copyResult() {
    const stored = snapshot.todayResult;
    if (!stored) return;
    const sequence = [...stored.sequence].map((value) => value === "1");
    const text = formatSwitchyardDailyShare(
      todayKey,
      { score: stored.score, strikes: stored.strikes, won: stored.won, sequence },
      snapshot.streak,
    );
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!legacyCopy(text)) throw new Error("Clipboard unavailable");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const result = snapshot.todayResult;
  const status = result
    ? result.won
      ? `Yard cleared · ${result.score} pts · ${result.strikes} ${result.strikes === 1 ? "strike" : "strikes"}`
      : `Shift ended · ${result.score} pts · clear the yard to count today`
    : snapshot.streak > 0
      ? `Clear today's yard to extend your ${snapshot.streak}-day streak.`
      : "Clear today's yard to start a streak.";

  return (
    <section className={styles.progress} aria-label="Switchyard Daily staged progress" data-switchyard-complete={result ? "true" : "false"}>
      <div className={styles.stat}>
        <span>Clear streak</span>
        <strong data-switchyard-streak>{snapshot.streak}</strong>
        <small>{snapshot.streak === 1 ? "day" : "days"}</small>
      </div>
      <div className={styles.copy} aria-live="polite">
        <strong data-switchyard-today>{status}</strong>
        <span>Best result for each UTC date stays in this browser. Failed shifts do not advance the clear streak.</span>
      </div>
      {result ? (
        <button type="button" className={styles.share} data-switchyard-share onClick={copyResult}>
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy result"}
        </button>
      ) : null}
    </section>
  );
}
