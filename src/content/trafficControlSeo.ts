import type { GameSeoContent } from "./gameSeo";

export const trafficControlSeo: GameSeoContent = {
  summary: "Traffic Control is a one-input arcade game about reading queue pressure rather than memorizing a rhythm. North-south and east-west demand arrive in shifting seeded waves, so every signal change trades current flow against the queue building on the stopped approach.",
  howTo: [
    "Watch both approaches, the pressure bar, and the explicit N/S or E/W go/stop label.",
    "Tap, click, press Space, or press Enter to request a signal change. A short all-red safety interval occurs before the other axis receives green.",
    "Keep clearing cars to build score and combo while preventing either queue from overflowing.",
    "Gridlock ends the run. Restart immediately and react to the new demand waves rather than using a fixed switching cadence.",
  ],
  concepts: ["Queue management", "Asymmetric demand", "Signal timing", "Reactive control", "Pressure management", "Risk versus throughput"],
  strategy: [
    "Do not switch on a fixed beat. Demand shifts between approaches, so the useful signal is the relative queue pressure you can see now.",
    "Avoid panic-switching. Every change includes a short all-red period where neither approach clears, so unnecessary flips can make both queues worse.",
    "Protect the neglected approach before it reaches critical pressure, but let the active approach clear enough cars to preserve combo and avoid wasting capacity.",
  ],
  faqs: [
    { question: "Why does the intersection go all red when I switch?", answer: "The short all-red phase represents a safety clearance interval. It also makes rapid repeated switching costly, so good play depends on timing rather than button mashing." },
    { question: "Why does a fixed switching rhythm stop working?", answer: "Traffic demand changes in seeded waves. One approach can become much busier than the other, so a fixed cadence eventually gives green time to the wrong queue." },
    { question: "What ends a Traffic Control run?", answer: "A run ends only when an approach exceeds its queue capacity and the intersection gridlocks. The game does not claim a collision unless the simulation actually models one." },
  ],
};
