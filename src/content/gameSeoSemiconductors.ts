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
      { question: "Is Sand Hill VC based on real companies?", answer: "No. The companies are fictional teaching cases built around real semiconductor business models and diligence concepts such as design wins, foundry dependency, NRE, process nodes, packaging, EDA, RF, power devices, memory, metrology, and photonics." },
      { question: "Why do I have to walk around the office?", answer: "The movement is intentional. The game models venture work as competing tasks happening in parallel: founders arrive, diligence capacity is limited, portfolio companies need attention, news changes the environment, and capital decisions consume time and reserves." },
      { question: "Does the fund return predict real VC outcomes?", answer: "No. Portfolio marks and outcomes are synthetic and compressed into a short game session. The goal is to teach the structure of semiconductor venture decisions, not forecast investment performance." },
    ],
  },
  "chip-architect": {
    summary: "Chip Architect is a walkable ASIC design lab. Customer specifications arrive with performance, power, area, and timing targets. You physically collect compute, memory, network-on-chip, and I/O IP, place the blocks into a floorplan, choose a clock mode, run verification, and tape out only when the design closes against the customer target.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to an IP block in the library and press E or Space to pick it up.",
      "Carry compute, memory, NoC, and I/O blocks to the matching positions on the central floorplan. You can remove or swap installed blocks by returning to a slot.",
      "Watch live PPA numbers: performance must reach the customer minimum while power and area stay below their limits. Timing margin must also close.",
      "Use the Clock / PVT station to cycle Balanced, Turbo, and Eco modes. Frequency changes performance, power, and timing, and any design change invalidates the previous verification result.",
      "Run RTL / timing verification, then move to Tapeout once the verified design meets the full specification. New customers demand different architectures, so one floorplan does not solve every job.",
    ],
    concepts: ["Performance, power, and area (PPA)", "Timing closure", "RTL verification", "Floorplanning", "Network-on-chip topology", "On-die SRAM", "SerDes tradeoffs", "Clock-frequency tradeoffs", "IP reuse", "Tapeout", "Known implementation margin", "Workload-specific architecture"],
    strategy: [
      "Start from the workload. AI inference rewards vector compute and bandwidth; edge products reward efficiency and timing headroom; switching silicon rewards I/O bandwidth.",
      "Do not optimize performance alone. A design that is fast but misses power, area, or timing cannot tape out.",
      "Use Eco mode as a timing and power rescue tool, and Turbo only when the design has enough timing and power headroom.",
      "Verification is not permanent. Swapping a block or changing the clock mode means you must verify the new implementation again before tapeout.",
    ],
    faqs: [
      { question: "What does PPA mean?", answer: "PPA stands for performance, power, and area. Chip teams constantly trade those three dimensions while also closing timing and meeting reliability constraints." },
      { question: "Why can the same IP mix work for one customer and fail another?", answer: "Different workloads value different resources. An AI accelerator may need vector throughput and memory bandwidth, while an edge SoC may prioritize power, die size, and timing margin." },
      { question: "Is this a transistor-level chip simulator?", answer: "No. It is a compressed architecture game designed to make system-level semiconductor tradeoffs playable in a few minutes." },
    ],
  },
  "packaging-lab": {
    summary: "Packaging Lab is a spatial advanced-packaging game. You carry compute dies, HBM stacks, I/O dies, silicon bridges, optical engines, and thermal spreaders onto a six-site package substrate. The exact placement changes usable bandwidth, thermal coupling, warpage, and package yield before X-ray/reflow inspection and shipment.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to a component bin and press E or Space to carry that die or package element.",
      "Place components into any of the six substrate sites. Components next to compute can deliver more useful package bandwidth, while hot neighbors raise thermal coupling.",
      "Balance the package physically. Uneven component weight increases warpage risk, and a thermal spreader can reduce a neighboring hotspot at the cost of a substrate site.",
      "Use the Bond Profile station to choose Fast, Gentle, or Balanced processing. Faster processing shortens inspection time but reduces yield and increases warpage; Gentle processing does the reverse.",
      "Run X-ray / reflow inspection. The process continues while you can move around the lab. A passing package can be shipped; a failing package must be reworked and reinspected.",
    ],
    concepts: ["Advanced semiconductor packaging", "Chiplets", "HBM placement", "Die-to-die interconnect", "Co-packaged optics", "Thermal coupling", "Package warpage", "Known-good-die yield", "Reflow", "X-ray inspection", "Silicon bridges", "System-level yield"],
    strategy: [
      "Adjacency matters. Place bandwidth-producing components next to compute dies when the customer is bandwidth constrained.",
      "Avoid clustering every hot component together. Thermal spreaders are most valuable beside high-heat dies, not in an isolated corner.",
      "Keep package mass reasonably balanced from left to right and top to bottom to control warpage.",
      "Use Gentle bonding when yield or warpage is the constraint; use Fast only when the package already has enough manufacturing margin and the customer clock is running out.",
    ],
    faqs: [
      { question: "Why does HBM placement affect bandwidth?", answer: "Real advanced packages are constrained by physical interconnect distance, routing, power, and signal integrity. The game compresses that into an adjacency bonus so placement has a clear, playable consequence." },
      { question: "What is package warpage?", answer: "Warpage is physical deformation of the package or substrate caused by materials, temperature, geometry, and stress. Excess warpage can hurt assembly and reliability." },
      { question: "Why does adding more dies reduce yield?", answer: "A multi-die package only succeeds when its individual dies and package-level assembly steps all work. More components generally create more opportunities for a package-level failure." },
    ],
  },
};

export function getSemiconductorGameSeoContent(slug: string): GameSeoContent | undefined {
  return semiconductorGameSeo[slug];
}
