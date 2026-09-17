"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publicGameRegistry } from "@/games/registry";
import {
  ACHIEVEMENTS,
  achievementLabel,
  dailyChallenges,
  emptyProgression,
  masteryLevel,
  progressionLevel,
  readProgression,
  xpIntoCurrentLevel,
} from "@/lib/progression/playerProgression";
import styles from "./ProgressDashboard.module.css";

const achievementCopy: Record<string, string> = {
  [ACHIEVEMENTS.firstRun.id]: "Start your first game on the network.",
  [ACHIEVEMENTS.finisher.id]: "Complete a game or meaningful run.",
  [ACHIEVEMENTS.explorer.id]: "Play five different games.",
  [ACHIEVEMENTS.specialist.id]: "Build 150 mastery XP in one title.",
  [ACHIEVEMENTS.streaker.id]: "Play on three consecutive days.",
  [ACHIEVEMENTS.veteran.id]: "Start twenty sessions across the network.",
};

export function ProgressDashboard() {
  const [progression, setProgression] = useState(emptyProgression);

  useEffect(() => {
    setProgression(readProgression(window.localStorage));
  }, []);

  const challenges = dailyChallenges(progression);
  const masteryRows = useMemo(() => {
    return publicGameRegistry
      .map((game) => ({ game, mastery: progression.mastery[game.slug] ?? { xp: 0, sessions: 0, completions: 0 } }))
      .filter((row) => row.mastery.xp > 0)
      .sort((a, b) => b.mastery.xp - a.mastery.xp || a.game.title.localeCompare(b.game.title));
  }, [progression.mastery]);

  const level = progressionLevel(progression.xp);
  const levelProgress = xpIntoCurrentLevel(progression.xp);

  return (
    <>
      <div className={styles.summaryGrid}>
        <div className={styles.metric}>
          <span>Network level</span>
          <strong>{level}</strong>
          <div className={styles.levelBar} aria-label={`${levelProgress}% to next level`}>
            <div className={styles.levelFill} style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
        <div className={styles.metric}>
          <span>Total XP</span>
          <strong>{progression.xp}</strong>
        </div>
        <div className={styles.metric}>
          <span>Current streak</span>
          <strong>{progression.streak}d</strong>
        </div>
        <div className={styles.metric}>
          <span>Games explored</span>
          <strong>{progression.playedGames.length}</strong>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="daily-goals-heading">
        <p className="eyebrow">Today</p>
        <h2 id="daily-goals-heading">Daily goals</h2>
        <div className={styles.challengeGrid}>
          {challenges.map((challenge) => (
            <div key={challenge.id} className={`${styles.challenge} ${challenge.completed ? styles.challengeDone : ""}`}>
              <span className={styles.muted}>{challenge.completed ? "Complete" : `${Math.min(challenge.current, challenge.target)}/${challenge.target}`}</span>
              <strong>{challenge.label}</strong>
              <p>{challenge.completed ? "Done for today." : "Play naturally; this goal tracks across the network."}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="badges-heading">
        <p className="eyebrow">Milestones</p>
        <h2 id="badges-heading">Badges</h2>
        <div className={styles.badgeGrid}>
          {Object.values(ACHIEVEMENTS).map((achievement) => {
            const unlocked = progression.achievements.includes(achievement.id);
            return (
              <div key={achievement.id} className={styles.badge}>
                <span className={styles.muted}>{unlocked ? "Unlocked" : "Locked"}</span>
                <strong>{achievementLabel(achievement.id)}</strong>
                <p>{achievementCopy[achievement.id]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="mastery-heading">
        <p className="eyebrow">Per-game progression</p>
        <h2 id="mastery-heading">Mastery</h2>
        {masteryRows.length ? (
          <div className={styles.masteryGrid}>
            {masteryRows.map(({ game, mastery }) => (
              <Link key={game.slug} href={`/games/${game.slug}`} className={styles.mastery}>
                <div className={styles.masteryTop}>
                  <span className={styles.muted}>{game.lane} · {game.category}</span>
                  <span className={styles.muted}>Lv {masteryLevel(mastery.xp)}</span>
                </div>
                <strong>{game.title}</strong>
                <p>{mastery.xp} mastery XP · {mastery.sessions} sessions · {mastery.completions} completions</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>Play any game to start building mastery. Progress is stored locally in this browser.</div>
        )}
      </section>
    </>
  );
}
