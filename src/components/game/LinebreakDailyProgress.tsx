"use client";

import { useEffect, useState } from "react";
import { listLocalGameValues } from "@/games/_shared/storage/localGameStorage";
import { puzzleForDateKey, utcDateKey } from "@/games/linebreak-daily/model";
import { activeDailyStreak, formatDailyShare } from "@/games/linebreak-daily/progress";
import { captureGameEvent } from "@/lib/analytics/client";
import { absoluteUrl } from "@/lib/site";

const GAME_SLUG = "linebreak-daily";
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

type StoredDailyResult = {
  puzzleId: string;
  segments: number;
  completedAt: string;
};

type ProgressSnapshot = {
  todayResult: StoredDailyResult | null;
  streak: number;
  signature: string;
};

const EMPTY_SNAPSHOT: ProgressSnapshot = {
  todayResult: null,
  streak: 0,
  signature: "",
};

function readProgressSnapshot(): ProgressSnapshot {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  const todayKey = utcDateKey();
  const records = listLocalGameValues<StoredDailyResult>(GAME_SLUG, "daily-", SAVE_VERSION);
  const completedDates = records
    .map((record) => record.name.slice("daily-".length))
    .filter((dateKey) => /^\d{4}-\d{2}-\d{2}$/.test(dateKey))
    .sort();
  const todayResult = records.find((record) => record.name === `daily-${todayKey}`)?.value ?? null;
  const streak = activeDailyStreak(completedDates, todayKey);
  return {
    todayResult,
    streak,
    signature: `${completedDates.join(",")}|${todayResult?.segments ?? ""}`,
  };
}

function legacyCopy(text: string): boolean {
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

export function LinebreakDailyProgress() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(EMPTY_SNAPSHOT);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const todayKey = utcDateKey();
  const puzzle = puzzleForDateKey(todayKey);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active) return;
      const next = readProgressSnapshot();
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

  async function shareResult() {
    if (!snapshot.todayResult) return;
    const text = formatDailyShare(
      todayKey,
      snapshot.todayResult.segments,
      puzzle.inkLimit,
      snapshot.streak,
      absoluteUrl("/games/linebreak-daily"),
    );

    try {
      if (navigator.share) {
        captureGameEvent("share_clicked", {
          game_slug: GAME_SLUG,
          game_version: GAME_VERSION,
          date_key: todayKey,
          segments: snapshot.todayResult.segments,
          streak: snapshot.streak,
          method: "native",
        });
        await navigator.share({ title: "Linebreak Daily", text });
        setShareState("shared");
        return;
      }

      captureGameEvent("share_clicked", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        date_key: todayKey,
        segments: snapshot.todayResult.segments,
        streak: snapshot.streak,
        method: "clipboard",
      });

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!legacyCopy(text)) {
        throw new Error("Clipboard unavailable");
      }
      setShareState("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("failed");
    }
  }

  const completed = Boolean(snapshot.todayResult);
  const spare = snapshot.todayResult ? Math.max(0, puzzle.inkLimit - snapshot.todayResult.segments) : null;
  const shareLabel = shareState === "shared"
    ? "Shared"
    : shareState === "copied"
      ? "Copied"
      : shareState === "failed"
        ? "Copy failed"
        : "Share result";

  return (
    <section className="daily-progress" data-linebreak-complete={completed ? "true" : "false"} aria-label="Linebreak Daily progress">
      <div className="daily-progress-stat">
        <span>Active streak</span>
        <strong data-linebreak-streak>{snapshot.streak}</strong>
        <small>{snapshot.streak === 1 ? "day" : "days"}</small>
      </div>
      <div className="daily-progress-copy" aria-live="polite">
        {snapshot.todayResult ? (
          <>
            <strong data-linebreak-today>Today complete · {snapshot.todayResult.segments}/{puzzle.inkLimit} ink · {spare} spare</strong>
            <span>Your best result for this date stays in this browser.</span>
          </>
        ) : (
          <>
            <strong>{snapshot.streak > 0 ? `Finish today to extend your ${snapshot.streak}-day streak.` : "Finish today to start a streak."}</strong>
            <span>Daily history is stored locally. No account required.</span>
          </>
        )}
      </div>
      {snapshot.todayResult ? (
        <button className="button daily-share-button" data-linebreak-share type="button" onClick={shareResult}>
          {shareLabel}
        </button>
      ) : null}
    </section>
  );
}
