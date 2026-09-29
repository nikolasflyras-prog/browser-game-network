import type { GameSeoContent } from "./gameSeo";

const semiconductorVcDepthSeo: Record<string, GameSeoContent> = {
  "semiconductor-vc": {
    summary: "Sand Hill VC is a real-time semiconductor venture-fund game. Review incoming deals, run diligence, build ownership, manage reserves and operating support, respond to financing and company events, and realize winners into distributions while TVPI and DPI evolve through the fund cycle.",
    howTo: [
      "Open an incoming founder's file before its deadline. The fund clock and other opportunities continue to move.",
      "Run technical diligence to reveal a hidden fact, then pass or invest $500K or $1M at investment committee.",
      "Watch ownership and carrying value. Portfolio events include rounds, bridges, refinancing, fab delays, board meetings, customer slips, and rival VC offers.",
      "Support a portfolio company when the expected outcome justifies the cost, or decline and accept its consequences. Earlier decisions affect later events at the same company.",
      "Realize an eligible investment to convert its carrying value into a distribution and increase DPI.",
      "Hire analysts from the operating budget to speed diligence. Finish the five-minute fund cycle balancing new investments, reserves, ownership, distributions, reputation, and team capacity.",
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
      "Use diligence selectively. The fund clock keeps moving while analysts work, so attention and staffing are scarce resources alongside capital.",
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
