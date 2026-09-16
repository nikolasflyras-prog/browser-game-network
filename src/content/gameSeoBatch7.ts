import type { GameSeoContent } from "./gameSeo";

const batch7GameSeoContent: Record<string, GameSeoContent> = {
  "skybound": {
    summary: "Skybound is an endless vertical platformer with automatic jumping. You control only horizontal steering while gravity and each platform landing create the next bounce, so every decision is about lining up the next landing before the climb carries you past it.",
    howTo: ["Use Left/Right or A/D to steer in the air. On touch or mouse, hold on the side of the player you want to move toward.", "Landing on a green platform automatically launches the player upward again; there is no jump button.", "Climbing above the camera line scrolls the platform field downward and adds height to the run.", "Missing the platform chain and falling below the viewport ends the run."],
    concepts: ["Platforming physics", "Air control", "Momentum planning", "Camera-relative navigation", "Compounding difficulty"],
    strategy: ["Start steering early during the upward half of each bounce so the descent becomes a small correction rather than a full-screen rescue.", "The center of a platform gives you the most options for the following jump; edge landings may save the current bounce but reduce your next setup time.", "Watch two platforms ahead when the camera scrolls. The best current landing is often the one that creates a clean angle to the next platform."],
    faqs: [{ question: "Is there a jump button in Skybound?", answer: "No. Every platform landing automatically creates the next bounce. The player's direct control is horizontal steering." }, { question: "How does Skybound get harder?", answer: "As height increases, horizontal speed rises, vertical gaps increase, and generated platforms gradually become narrower." }, { question: "Does Skybound save my best run?", answer: "Yes. The highest local score is stored in this browser." }],
  },
  "circuit-coil": {
    summary: "Circuit Coil is a continuous growing-trail survival game. The coil advances one cell at a time while you choose turns, collect power nodes, and become physically longer. Every pickup increases both score and the amount of your own trail that can end the run.",
    howTo: ["Turn with the arrow keys or WASD. On touch or mouse, tap in the direction you want the head to turn.", "Collect the yellow power node to add one segment to the coil and increase the score.", "You cannot reverse directly into the segment behind the head; choose a perpendicular turn instead.", "Hitting the outer grid or any occupied part of your own trail breaks the circuit. The step interval shortens as score rises."],
    concepts: ["Growing-trail planning", "Spatial memory", "Irreversible turns", "Self-collision avoidance", "Speed ramp"],
    strategy: ["Preserve open corridors instead of circling tightly around every power node; early space is worth more once the trail grows.", "Plan at least two turns before entering a corner because immediate reversal is intentionally blocked.", "As speed rises, favor broad loops around the grid perimeter and cut inward only when the power-node route leaves a safe exit."],
    faqs: [{ question: "Can I reverse direction immediately?", answer: "No. A direct 180-degree reversal is rejected because it would move the head into the next body segment." }, { question: "What makes Circuit Coil harder over time?", answer: "Each collected node lengthens the trail and also reduces the time between movement steps." }, { question: "Does Circuit Coil use the same board each run?", answer: "The starting geometry is fixed, while power-node placement follows a deterministic pseudo-random sequence for each run." }],
  },
};

export function getBatch7GameSeoContent(slug: string): GameSeoContent | undefined { return batch7GameSeoContent[slug]; }
