import type { GameSeoContent } from "@/content/gameSeo";
import type { GameMetadata } from "@/games/registry";
import type { GameEventName } from "@/games/_shared/types/runtime";

export type FutureGamePromotionSlug =
  | "traffic-control"
  | "switchyard-daily"
  | "market-maker"
  | "supply-chain-shock"
  | "chip-fab"
  | "power-grid-dispatcher";

type PromotionRegistryMetadata = Omit<GameMetadata, "status" | "version"> & {
  status: "prototype";
  version: "0.1.0";
};

export type FutureGamePromotionManifest = {
  registry: PromotionRegistryMetadata;
  seo: GameSeoContent;
  surface: "phaser" | "react";
  analytics: readonly GameEventName[];
  promotionGate: string;
};

export const futureGamePromotionManifests: Record<FutureGamePromotionSlug, FutureGamePromotionManifest> = {
  "traffic-control": {
    registry: {
      slug: "traffic-control",
      title: "Traffic Control",
      description: "Run a busy intersection with one signal switch. Read queue pressure, change right-of-way at the right moment, and delay gridlock for as long as possible.",
      lane: "Play",
      category: "Arcade Management",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Traffic Control is a one-input queue-management game. North-south and east-west demand arrives in uneven waves, so fixed timing eventually fails and the player must switch the signal based on visible pressure.",
      howTo: [
        "Watch both traffic queues and the pressure meter instead of switching on a fixed rhythm.",
        "Tap, click, press Space, or press Enter to request a signal change.",
        "During the all-red transition no direction moves. Survive as long as possible before gridlock ends the run.",
      ],
      concepts: ["Queue management", "Feedback control", "Switching cost", "Demand waves"],
      strategy: [
        "Do not wait for both queues to look equally bad; protect the side whose pressure is accelerating.",
        "Every switch creates a short all-red cost, so rapid toggling can be worse than tolerating a temporary imbalance.",
        "Use the explicit N/S and E/W phase label as the source of truth when the intersection gets visually crowded.",
      ],
      faqs: [
        { question: "Why not switch on a timer?", answer: "Demand is intentionally asymmetric and changes in waves. A fixed cadence eventually serves the wrong side while the other queue grows." },
        { question: "What ends a run?", answer: "The run ends when queue pressure reaches the gridlock threshold. There is no random collision failure in the first version." },
      ],
    },
    surface: "phaser",
    analytics: ["game_started", "game_action", "game_over", "game_restarted"],
    promotionGate: "Promote when Orbit Relay validates high restart rate or repeated short runs.",
  },
  "switchyard-daily": {
    registry: {
      slug: "switchyard-daily",
      title: "Switchyard Daily",
      description: "Route each train to its target depot by reading three visible switches. Change one switch or hold, then watch the network resolve your decision.",
      lane: "Play",
      category: "Daily Logic Puzzle",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Switchyard Daily is a deterministic routing puzzle with one shared seed per UTC date. Each turn shows the current switch state and a target depot; the player changes A, B, C, or holds and must predict where the train will actually travel.",
      howTo: [
        "Read switch A at the root, then B or C on the selected branch.",
        "Choose A, B, C, or Hold. Only that switch change happens before the train moves.",
        "Route the daily sequence with fewer than three strikes. The result grid can be shared without revealing target depots or switch solutions.",
      ],
      concepts: ["State routing", "Conditional logic", "Mental simulation", "Daily deterministic puzzles"],
      strategy: [
        "Trace the route from A outward before touching a control; do not reason backward from the target alone.",
        "Remember that changing A can move the train onto the other branch, making B or C irrelevant for that turn.",
        "Hold is a real action when the current switch state already reaches the target.",
      ],
      faqs: [
        { question: "Is the puzzle the same for everyone each day?", answer: "Yes. The UTC date deterministically creates the same daily seed." },
        { question: "Does sharing reveal the solution?", answer: "No. The staged share format includes only correct-or-missed outcomes, score, strikes, and streak metadata." },
      ],
    },
    surface: "phaser",
    analytics: ["daily_started", "game_action", "daily_completed", "game_completed", "game_restarted", "share_clicked"],
    promotionGate: "Promote when Linebreak Daily leads the MVP on return rate, daily completion, or sharing.",
  },
  "market-maker": {
    registry: {
      slug: "market-maker",
      title: "Market Maker",
      description: "Set bid and ask quotes across short trading rounds. Balance customer flow, spread capture, informed moves, and inventory risk instead of optimizing one number.",
      lane: "Learn",
      category: "Finance Simulation",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Market Maker is a short finance simulation about quoting two-sided markets. The chosen spread and quote skew directly change fill probability, while inventory and fair-value moves determine whether apparent spread capture survives mark-to-market and risk penalties.",
      howTo: [
        "Inspect fair value, current inventory, and the exact bid/ask attached to each quote posture.",
        "Choose tight, balanced, wide, lean-long, or lean-short, then make the market for that round.",
        "Use quote skew to encourage flow that reduces an inventory imbalance while keeping enough spread to be paid for risk.",
      ],
      concepts: ["Bid-ask spread", "Inventory risk", "Order flow", "Market making", "Mark-to-market P&L"],
      strategy: [
        "Tight quotes win more flow but expose you to informed trading and faster inventory accumulation.",
        "Wide quotes protect against bad fills but can create too many no-flow rounds to earn enough spread.",
        "When inventory is large, lean the quote in the direction that makes the position easier for customers to take off your hands.",
      ],
      faqs: [
        { question: "Why can a profitable trade still hurt the final score?", answer: "The dealer is marked to the new fair value and can also pay an inventory risk penalty. Spread capture is only one part of the result." },
        { question: "What does quote skew do?", answer: "Skew shifts the quote center so one side becomes more attractive, helping the dealer work down a long or short inventory position." },
      ],
    },
    surface: "react",
    analytics: ["game_started", "game_action", "game_completed", "game_restarted"],
    promotionGate: "Promote first in Learn when Run the Fed validates finance learning plus repeat short sessions.",
  },
  "supply-chain-shock": {
    registry: {
      slug: "supply-chain-shock",
      title: "Supply Chain Shock",
      description: "Manage service, cash, inventory, resilience, and backlog through supplier warnings, congestion, demand spikes, and shutdowns where earlier preparation changes later options.",
      lane: "Learn",
      category: "Operations Simulation",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Supply Chain Shock is a decision simulation about preparing for and responding to disruptions. Resilience is path dependent: backup capacity and earlier investment cost money before a shock but can unlock better responses when the network later fails.",
      howTo: [
        "Review the current service, cash, inventory, resilience, and backlog metrics before each scenario.",
        "Choose one operating response and read the immediate causal feedback before the next shock arrives.",
        "Finish the sequence with strong service and resilience without exhausting cash or creating uncontrolled backlog and inventory.",
      ],
      concepts: ["Supply-chain resilience", "Inventory tradeoffs", "Contingency capacity", "Service levels", "Backlog"],
      strategy: [
        "Treat resilience as insurance: it costs resources before the disruption and only pays if later conditions make it useful.",
        "Avoid spending aggressively on every emergency; preserving cash can matter as much as protecting the current service metric.",
        "Watch backlog after demand shocks because short-term service decisions can create delayed operating pressure.",
      ],
      faqs: [
        { question: "Can I use backup capacity without preparing it first?", answer: "No. The staged model uses state-dependent requirements so later contingency actions can depend on earlier preparation." },
        { question: "Is more inventory always better?", answer: "No. Inventory can buffer disruption, but excess stock ties up resources and can become a penalty rather than a universal good." },
      ],
    },
    surface: "react",
    analytics: ["game_started", "game_action", "game_completed", "game_restarted"],
    promotionGate: "Promote when Run the Fed validates completion/search intent and educational depth matters more than rapid replay.",
  },
  "chip-fab": {
    registry: {
      slug: "chip-fab",
      title: "Chip Fab",
      description: "Run a semiconductor fab through ramp pressure, metrology drift, bottlenecks, and maintenance choices while balancing yield, throughput, cycle time, defects, and cash.",
      lane: "Learn",
      category: "Semiconductor Simulation",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Chip Fab is a semiconductor operations simulation about the tension between utilization and process control. Decisions that push more wafers through the line can still lose if yield, defect risk, or cycle time deteriorate enough.",
      howTo: [
        "Track yield, throughput, cycle time, defect risk, and cash before every fab event.",
        "Choose how aggressively to ramp, investigate drift, relieve bottlenecks, and schedule maintenance.",
        "Finish with productive throughput that survives yield and defect penalties rather than maximizing raw utilization alone.",
      ],
      concepts: ["Semiconductor yield", "Fab throughput", "Cycle time", "Metrology", "Preventive maintenance"],
      strategy: [
        "Do not treat throughput as the only objective; bad process control can turn extra wafer starts into expensive low-yield output.",
        "Use metrology and maintenance before defect risk becomes irreversible operating debt.",
        "A bottleneck improvement is most valuable when upstream and downstream process health can support the extra flow.",
      ],
      faqs: [
        { question: "Why can higher utilization lower the score?", answer: "Utilization can increase throughput while also worsening cycle time, defects, or yield. The simulation rewards useful output, not activity for its own sake." },
        { question: "Is this a model of one real fab?", answer: "No. It is a simplified systems-learning game using semiconductor manufacturing concepts rather than a forecast or replica of a specific factory." },
      ],
    },
    surface: "react",
    analytics: ["game_started", "game_action", "game_completed", "game_restarted"],
    promotionGate: "Promote when specialist technical traffic or engagement justifies a narrower semiconductor title.",
  },
  "power-grid-dispatcher": {
    registry: {
      slug: "power-grid-dispatcher",
      title: "Power Grid Dispatcher",
      description: "Keep a power system reliable through ramps, renewable shortfalls, heat waves, and transmission outages while balancing reserve, storage, cost, and emissions.",
      lane: "Learn",
      category: "Energy Systems Simulation",
      status: "prototype",
      version: "0.1.0",
    },
    seo: {
      summary: "Power Grid Dispatcher is an energy-systems simulation where reliability is a gate rather than just another weighted metric. The player must carry reserve and manage storage state while cost and emissions compete for the remaining headroom.",
      howTo: [
        "Read reliability, reserve, storage, cost, and emissions before each grid event.",
        "Dispatch a response to morning ramps, wind drops, heat waves, and transmission constraints.",
        "Protect reliability first, then minimize the cost and emissions required to keep enough reserve for the next event.",
      ],
      concepts: ["Grid reliability", "Operating reserve", "Energy storage", "Dispatch", "Renewable variability"],
      strategy: [
        "Do not spend storage as if it resets every turn; state carried into the next event changes which responses remain safe.",
        "Cheap or low-emissions dispatch is not a win if reliability collapses during a later contingency.",
        "Reserve is option value: carrying some unused capacity can be rational when the next shock is uncertain.",
      ],
      faqs: [
        { question: "Why is reliability treated differently from cost?", answer: "A blackout is a hard system failure, so the model prevents cheap or clean strategies from winning simply by accepting unreliable service." },
        { question: "Does storage refill automatically?", answer: "No. Storage is modeled as state with consequences, so using it now can leave less flexibility for the next event." },
      ],
    },
    surface: "react",
    analytics: ["game_started", "game_action", "game_completed", "game_restarted"],
    promotionGate: "Promote when Learn engagement is strong enough to expand from business/finance into broader infrastructure and STEM topics.",
  },
};
