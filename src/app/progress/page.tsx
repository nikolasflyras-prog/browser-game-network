import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progression/ProgressDashboard";

export const metadata: Metadata = {
  title: "Progress",
  description: "Track Browser Game Network XP, per-game mastery, daily goals, streaks, and badges.",
};

export default function ProgressPage() {
  return (
    <div className="page-shell">
      <section className="catalog-intro">
        <p className="eyebrow">Player progression</p>
        <h1>Progress</h1>
        <p className="lede">
          Build network XP without flattening every game into the same loop. Each title keeps its own mechanics while sessions, completions, exploration, mastery, streaks, and milestones connect the whole network.
        </p>
      </section>
      <ProgressDashboard />
    </div>
  );
}
