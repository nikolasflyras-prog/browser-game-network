import type { GameSeoContent } from "./gameSeo";

const fabFloorBusinessSeo: Record<string, GameSeoContent> = {
  "fab-floor": {
    summary: "Fab Floor v2 is a walkable semiconductor manufacturing-business simulation. You still manage wafer starts, WIP, bottlenecks, tool health, and yield on the physical fab floor, but now customer contracts impose lot-count, yield, and deadline targets while you decide when to spend operating cash on tool capex or equipment technicians and when the fab is ready to advance to a harder process program.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to FOUP Release and press E or Space to start wafer lots. Lots move continuously through lithography, etch, and metrology while queues, age, tool health, and alarms keep evolving.",
      "Read the live customer order at the top of the screen. Each contract specifies a required number of completed lots, a minimum contract yield, a deadline, and a cash reward. Shipping enough lots at poor yield does not win the order.",
      "Walk near a process tool and press E or Space to move engineering focus. Focus is still the fastest short-term way to relieve the current bottleneck and reduce wear at that tool group.",
      "Walk to the CapEx station to upgrade the currently focused lithography, etch, or metrology tool group. CapEx consumes cash but increases processing speed and makes upgraded equipment more resilient to the tighter process windows of advanced nodes.",
      "Walk to Operations to hire equipment technicians. Technicians consume cash but shorten maintenance downtime across the whole line, making them especially valuable once contract deadlines and leading-edge tool wear start to stack up.",
      "When a tool alarms, collect a maintenance kit and physically reach the affected tool. Customer deadlines continue counting down while equipment is offline.",
      "Win contracts to advance the fab program. Two wins move the simplified campaign from a mature 28nm planar program to 7nm FinFET; four wins move it to a 3nm GAA program with higher rewards and tighter yield/tool-health pressure.",
    ],
    concepts: [
      "Wafer starts and WIP",
      "Cycle time and queueing",
      "Lithography, etch, and metrology",
      "Yield and good-die output",
      "Customer qualification and production contracts",
      "On-time delivery versus process quality",
      "Tool utilization and bottlenecks",
      "CapEx and equipment productivity",
      "Equipment technicians and maintenance staffing",
      "Preventive maintenance and uptime",
      "Mature-node versus leading-edge manufacturing",
      "FinFET and gate-all-around process generations",
      "Process-window tightening",
      "Manufacturing reputation and customer retention",
    ],
    strategy: [
      "Do not release wafers just because the FOUP station is ready. A larger queue can increase output in the short term but can also age WIP, damage yield, and cause a contract to miss its quality target.",
      "Treat the active contract as the objective function. A high-volume order may justify more starts and a throughput upgrade; a high-yield order may justify metrology capex, lower WIP, and earlier maintenance.",
      "Use engineering focus for temporary bottleneck relief and CapEx for structural capacity. Spending on the wrong tool can leave the real constraint untouched while consuming the cash you need for maintenance or staffing.",
      "Equipment technicians are a portfolio investment across all tools. Their value rises when alarms become more expensive because the customer deadline continues while a tool is down.",
      "As the node program advances, do not assume the previous operating recipe is still safe. The game deliberately tightens yield requirements and increases process sensitivity to teach why leading-edge ramps demand more process control and equipment discipline.",
    ],
    faqs: [
      { question: "Are the customer contracts or process nodes modeled exactly like a real foundry?", answer: "No. The customer names, economics, recipes, deadlines, and node transitions are synthetic and heavily compressed for gameplay. The purpose is to teach the direction of the real manufacturing tradeoffs rather than reproduce a foundry cost model." },
      { question: "Why does CapEx upgrade the currently focused tool?", answer: "The game uses engineering focus as the player's explicit statement of which process group is the current constraint. Requiring the CapEx station to follow that focus forces the player to diagnose the bottleneck before spending." },
      { question: "Why can a contract fail even if I complete enough lots?", answer: "Semiconductor customers care about usable output, not raw wafer movement. The game therefore requires both lot count and a minimum contract yield before an order is considered won." },
      { question: "What changes when the fab advances from 28nm to 7nm or 3nm?", answer: "The simplified node programs increase contract value while tightening yield requirements and making tool/process excursions more costly. They represent the general rise in process-control difficulty at leading-edge nodes, not a literal recipe comparison." },
      { question: "How is Fab Floor different from Chip Fab?", answer: "Chip Fab is a control-room operations simulation. Fab Floor is a spatial manufacturing-management game: you physically move through the factory, make staffing and CapEx decisions, respond to equipment problems, and manage customer commitments while the line keeps running." },
    ],
  },
};

export function getFabFloorBusinessSeoContent(slug: string): GameSeoContent | undefined {
  return fabFloorBusinessSeo[slug];
}
