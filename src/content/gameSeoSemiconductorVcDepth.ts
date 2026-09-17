import type { GameSeoContent } from "./gameSeo";

const semiconductorVcDepthSeo: Record<string, GameSeoContent> = {
  "semiconductor-vc": {
    summary: "Sand Hill VC is a walkable semiconductor venture-fund game. Source founders, carry deals through diligence and investment committee, build ownership, manage follow-on reserves and operating support, respond to financing and company events, and realize winners into distributions while TVPI and DPI evolve through the fund cycle.",
    howTo: [
      "Move with WASD or the arrow keys. Meet founders in the pitch rooms and press E or Space to pick up a deal file before they leave.",
      "Carry the file to diligence to reveal a hidden technical or commercial fact, then take it to investment committee and choose PASS, $500K, or $1M.",
      "Watch ownership as well as mark-to-market value. Portfolio events can be up rounds, bridges, down rounds, design wins, or customer slips.",
      "At Portfolio / Reserves, support financing events with follow-on capital when preserving ownership is worth the dry powder. Some operating events instead use the fund operating budget for board-level support.",
      "When an eligible holding reaches the liquidity threshold, walk to Liquidity / Exits and realize it. The carrying value leaves NAV and becomes a distribution, increasing DPI without artificially changing TVPI.",
      "Use the recruiting desk to add analysts, but remember staff and board support consume operating budget. Finish the five-minute cycle balancing new investments, reserves, ownership, distributions, reputation, and team capacity.",
    ],
    concepts: [
      "Venture fund construction",
      "Pre-money and post-money valuation",
      "Ownership percentage",
      "Dry powder",
      "Follow-on reserves",
      "Pro rata and dilution",
      "Up rounds and down rounds",
      "Bridge financing",
      "Board support",
      "Operating budget",
      "NAV",
      "TVPI",
      "DPI",
      "Realized vs unrealized value",
      "Semiconductor design stages",
      "Process nodes",
      "Foundry concentration",
      "Design wins",
      "NRE and tape-out cost",
      "Customer concentration",
      "Technical diligence",
      "Power-law outcomes",
    ],
    strategy: [
      "Do not optimize for the number of portfolio companies. Initial checks consume the same dry powder you may later need to defend ownership in your best investments.",
      "An up round can be good news even if you decline to invest, but your ownership may dilute. A down round can preserve more ownership if you support it while still destroying value. Separate price, ownership, and capital needs.",
      "Keep investment reserves separate from operating budget. Follow-on financing buys more ownership exposure; board support and staff consume the management-company resource instead.",
      "TVPI includes both remaining portfolio value and distributions. DPI counts only what has actually been realized. A marked-up portfolio can look strong while still returning no cash.",
      "Use diligence selectively. The office keeps moving while analysts work, so attention and staffing are scarce resources alongside capital.",
    ],
    faqs: [
      { question: "What is TVPI?", answer: "TVPI is total value to paid-in capital. In the game it combines current fund NAV and realized distributions relative to the original fund size." },
      { question: "What is DPI?", answer: "DPI is distributions to paid-in capital. It measures realized cash returned by exits rather than unrealized portfolio marks." },
      { question: "Why can TVPI stay the same when I exit a company?", answer: "Realizing an investment converts unrealized value into a distribution. The form of the value changes from NAV to DPI, but an exit at the current carrying value does not create value by itself." },
      { question: "Why does sitting out an up round reduce ownership?", answer: "New shares are issued to finance the company. If you do not buy enough of the new round, your percentage ownership is diluted even when the company valuation increases." },
      { question: "Are the companies real?", answer: "No. The companies are fictional teaching cases built around real semiconductor business models, financing patterns, and diligence concepts." },
    ],
  },
};

export function getSemiconductorVcDepthSeoContent(slug: string): GameSeoContent | undefined {
  return semiconductorVcDepthSeo[slug];
}
