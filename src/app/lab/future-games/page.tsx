import type { Metadata } from "next";
import { FutureGameLab } from "../../../../docs/future-games/ui/FutureGameLab";

export const metadata: Metadata = {
  title: "Future Games Lab",
  description: "Internal prototype QA surface for staged games.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FutureGamesLabPage() {
  return <FutureGameLab />;
}
