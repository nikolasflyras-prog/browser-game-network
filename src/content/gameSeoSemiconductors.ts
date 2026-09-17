import type { GameSeoContent } from "./gameSeo";

const semiconductorGameSeo: Record<string, GameSeoContent> = {
  "semiconductor-vc": {
    summary: "Sand Hill VC is a walkable semiconductor venture-capital game. You move through a live fund office, meet founders, carry deal files to diligence and investment committee, hire analysts, manage dry powder and follow-on reserves, react to semiconductor news, and watch portfolio marks evolve while the session continues.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to a founder in the pitch area and press E or Space to pick up the deal file.",
      "Carry the file to the diligence station to reveal a hidden technical or commercial signal. Additional analysts reduce the time before the diligence desk can be used again.",
      "Take the file to investment committee and physically choose PASS, $500K, or $1M by entering the corresponding decision zone and pressing E or Space.",
      "Watch portfolio marks and semiconductor news while new founders keep arriving. When a portfolio call appears, walk to the portfolio room and decide whether to use $250K of reserves for a follow-on.",
      "Use the recruiting desk to hire up to two additional analysts from the operating budget. Finish the five-minute fund cycle with strong NAV, reputation, and enough dry powder for the opportunities that matter.",
    ],
    concepts: ["Venture fund construction", "Pre-money and post-money valuation", "Ownership percentage", "Dry powder and reserves", "Follow-on investing", "Semiconductor design stages", "Process nodes", "Foundry concentration", "Design wins", "NRE and tape-out cost", "Customer concentration", "Technical diligence", "Portfolio mark-to-market", "Power-law outcomes"],
    strategy: [
      "Do not treat every strong technical company as an automatic investment. Price, concentration, design stage, and capital intensity all affect the risk you are taking.",
      "Use diligence when the hidden fact could change the decision. The office keeps moving while analysts work, so staff capacity has an opportunity cost.",
      "Preserve reserves. A full initial portfolio with no dry powder can leave you unable to support the companies that later need follow-on capital.",
      "Read semiconductor news as a portfolio-level signal, not a guaranteed company outcome. A sector tailwind can help a weak company, but it does not erase execution risk.",
    ],
    faqs: [
      { question: "Is Sand Hill VC based on real companies?", answer: "No. The companies are fictional teaching cases built around real semiconductor business models and diligence concepts." },
      { question: "Why do I have to walk around the office?", answer: "The movement models competing venture tasks happening in parallel: founders arrive, diligence capacity is limited, portfolio companies need attention, news changes the environment, and capital decisions consume time and reserves." },
      { question: "Does the fund return predict real VC outcomes?", answer: "No. Portfolio marks and outcomes are synthetic and compressed into a short game session." },
    ],
  },
  "chip-architect": {
    summary: "Chip Architect is a walkable ASIC design lab. Customer specifications arrive with performance, power, area, and timing targets. You physically collect compute, memory, network-on-chip, and I/O IP, place the blocks into a floorplan, choose a clock mode, run verification, and tape out only when the design closes against the customer target.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to an IP block in the library and press E or Space to pick it up.",
      "Carry compute, memory, NoC, and I/O blocks to the matching positions on the central floorplan. You can remove or swap installed blocks by returning to a slot.",
      "Watch live PPA numbers: performance must reach the customer minimum while power and area stay below their limits. Timing margin must also close.",
      "Use the Clock / PVT station to cycle Balanced, Turbo, and Eco modes. Frequency changes performance, power, and timing, and any design change invalidates the previous verification result.",
      "Run RTL / timing verification, then move to Tapeout once the verified design meets the full specification.",
    ],
    concepts: ["Performance, power, and area (PPA)", "Timing closure", "RTL verification", "Floorplanning", "Network-on-chip topology", "On-die SRAM", "SerDes tradeoffs", "Clock-frequency tradeoffs", "IP reuse", "Tapeout", "Workload-specific architecture"],
    strategy: ["Start from the workload.", "Do not optimize performance alone.", "Use Eco mode as a timing and power rescue tool.", "Reverify after swapping a block or changing clock mode."],
    faqs: [
      { question: "What does PPA mean?", answer: "PPA stands for performance, power, and area." },
      { question: "Why can the same IP mix work for one customer and fail another?", answer: "Different workloads value different resources and implementation margins." },
      { question: "Is this a transistor-level chip simulator?", answer: "No. It is a compressed architecture game built around system-level semiconductor tradeoffs." },
    ],
  },
  "packaging-lab": {
    summary: "Packaging Lab is a spatial advanced-packaging game. You carry compute dies, HBM stacks, I/O dies, silicon bridges, optical engines, and thermal spreaders onto a six-site package substrate. The exact placement changes usable bandwidth, thermal coupling, warpage, and package yield before X-ray/reflow inspection and shipment.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to a component bin and press E or Space to carry that die or package element.",
      "Place components into any of the six substrate sites. Components next to compute can deliver more useful package bandwidth, while hot neighbors raise thermal coupling.",
      "Balance the package physically. Uneven component weight increases warpage risk, and a thermal spreader can reduce a neighboring hotspot at the cost of a substrate site.",
      "Use the Bond Profile station to choose Fast, Gentle, or Balanced processing.",
      "Run X-ray / reflow inspection. A passing package can be shipped; a failing package must be reworked and reinspected.",
    ],
    concepts: ["Advanced semiconductor packaging", "Chiplets", "HBM placement", "Die-to-die interconnect", "Co-packaged optics", "Thermal coupling", "Package warpage", "Known-good-die yield", "Reflow", "X-ray inspection", "Silicon bridges", "System-level yield"],
    strategy: ["Adjacency matters.", "Avoid clustering every hot component together.", "Keep package mass balanced to control warpage.", "Use the bond profile to trade inspection speed against yield and warpage."],
    faqs: [
      { question: "Why does HBM placement affect bandwidth?", answer: "The game compresses interconnect-distance and routing effects into an adjacency bonus so placement has a playable consequence." },
      { question: "What is package warpage?", answer: "Warpage is physical deformation of the package or substrate caused by materials, temperature, geometry, and stress." },
      { question: "Why does adding more dies reduce yield?", answer: "More dies and assembly steps create more opportunities for a package-level failure." },
    ],
  },
  "fab-floor": {
    summary: "Fab Floor turns wafer-fab operations into a walkable shift. You release FOUP lots, watch work-in-process move through lithography, etch, and metrology, reassign engineering focus to bottlenecks, and physically carry maintenance kits to tool alarms while cycle time, tool health, yield, cash, and reputation continue changing.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to the FOUP release point and press E or Space to start a wafer lot.",
      "Watch each lot progress through lithography, etch, and metrology. Too many starts create queues and older WIP gradually loses quality.",
      "Walk near a process tool and press E or Space to move engineering focus there. Focus raises local processing capacity and slightly reduces wear.",
      "When a tool alarms, run to the maintenance bay, pick up a kit, then reach the affected tool and start preventive maintenance.",
      "Finish the shift with high good-die output, strong yield, controlled WIP, healthy tools, and enough cash and reputation to keep the line running.",
    ],
    concepts: ["Wafer starts", "Work in process (WIP)", "Cycle time", "Lithography", "Etch", "Metrology", "Tool utilization", "Bottlenecks", "Preventive maintenance", "Yield", "Queueing", "Process control"],
    strategy: [
      "Release lots deliberately; an overloaded line can look busy while actually extending cycle time and damaging yield.",
      "Move engineering focus to the active bottleneck rather than leaving it on one tool all shift.",
      "Treat alarms quickly. A stopped tool blocks every lot waiting behind it.",
      "Watch both output and WIP. More starts are not useful if the downstream line cannot clear them.",
    ],
    faqs: [
      { question: "Why does WIP hurt yield?", answer: "The game compresses several real effects into queue age: long waits increase cycle time and expose lots to more process and scheduling risk." },
      { question: "What does engineering focus represent?", answer: "It represents engineers and technicians concentrating on one tool group to improve throughput and stabilize operation." },
      { question: "Is Fab Floor the same as Chip Fab?", answer: "No. Chip Fab is the earlier control-room simulation. Fab Floor makes the same manufacturing ideas spatial: you physically walk the line and respond to the equipment." },
    ],
  },
  "data-center-architect": {
    summary: "Data Center Architect is a walkable AI-infrastructure game. You carry compute, network, power, cooling, and storage racks from staging into a live data hall. Rack adjacency changes usable network bandwidth and thermals, power redundancy constrains deployment, and running workloads keep scoring uptime while rack failures force physical repair decisions.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to staging and press E or Space to pick up a rack type.",
      "Install racks in the hall bays. Compute beside network gains usable fabric bandwidth; compute near liquid cooling reduces heat.",
      "Build enough compute, network, storage, power capacity, cooling, and redundancy for the current workload, then walk to Deploy and start it.",
      "Once a workload is live, capacity can degrade if a rack faults. Go to the repair station for a kit, then physically reach the failed bay to start repair.",
      "Complete the training, inference, and HPC workloads with high uptime, few SLA breaches, strong reputation, and efficient rack placement.",
    ],
    concepts: ["AI clusters", "GPU racks", "800G fabrics", "Power distribution", "UPS/PDU capacity", "Liquid cooling", "NVMe storage", "Redundancy", "Thermal headroom", "SLA uptime", "Rack failures", "Topology and adjacency"],
    strategy: [
      "Do not build compute first and infrastructure later. Power, cooling, and fabric capacity determine how much compute can actually be used.",
      "Put network close to compute to improve effective fabric bandwidth and cooling close to hot racks to create thermal headroom.",
      "Design redundancy before deployment. A topology that barely meets the spec can fall below SLA as soon as one rack fails.",
      "Keep repair routes in mind. Physical layout affects how quickly you can respond when a live workload loses a rack.",
    ],
    faqs: [
      { question: "Why does rack placement matter?", answer: "Real data centers are constrained by network topology, cable distance, cooling distribution, power domains, and serviceability. The game compresses those effects into spatial adjacency." },
      { question: "What is redundancy in the game?", answer: "Redundancy represents spare power and network paths that let the workload stay available through equipment failures." },
      { question: "Why can a cluster have lots of GPUs but still fail deployment?", answer: "Compute only becomes useful when the network, storage, power, and cooling systems can sustain the workload." },
    ],
  },
};

export function getSemiconductorGameSeoContent(slug: string): GameSeoContent | undefined {
  return semiconductorGameSeo[slug];
}
