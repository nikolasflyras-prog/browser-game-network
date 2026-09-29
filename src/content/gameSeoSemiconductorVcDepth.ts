import type { GameSeoContent } from "./gameSeo";

const semiconductorVcDepthSeo: Record<string, GameSeoContent> = {
  "semiconductor-vc": {
    summary: "Sand Hill VC is a week-by-week semiconductor venture-fund game with three spaces: the managing partner's office, deal room, and portfolio boardroom. Research companies, negotiate with founders, manage reserves and operating support, respond to financing events, and realize winners into distributions.",
    howTo: [
      "Start in the office to review fund performance, the research team, market news, and this week's priorities. Click between the three spaces whenever you want.",
      "In the deal room, open an incoming founder's file before its meeting window closes. The calendar only moves when you advance a week.",
      "Run technical diligence, build founder trust, negotiate valuation, or improve your offer while a rival VC pressures the allocation. Then pass or invest $500K or $1M.",
      "Watch ownership and carrying value. Portfolio events include rounds, bridges, refinancing, fab delays, board meetings, customer slips, and rival VC offers.",
      "In portfolio updates, support a company when the expected outcome justifies the cost, or decline and accept its consequences. Earlier decisions affect later events at the same company.",
      "Realize an eligible investment to convert its carrying value into a distribution and increase DPI.",
      "Hire analysts from the office to speed diligence. Advance one week when you are ready for new founders, market developments, and portfolio calls. Finish the fund cycle balancing investment returns and team capacity.",
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
      "Use diligence selectively. It occupies analysts until a later week, so attention and staffing are scarce resources alongside capital.",
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
