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
    concepts: [
      "Venture fund construction",
      "Pre-money and post-money valuation",
      "Ownership percentage",
      "Dry powder and reserves",
      "Follow-on investing",
      "Semiconductor design stages",
      "Process nodes",
      "Foundry concentration",
      "Design wins",
      "NRE and tape-out cost",
      "Customer concentration",
      "Technical diligence",
      "Portfolio mark-to-market",
      "Power-law outcomes",
    ],
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
};

export function getSemiconductorGameSeoContent(slug: string): GameSeoContent | undefined {
  return semiconductorGameSeo[slug];
}
