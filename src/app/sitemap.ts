import type { MetadataRoute } from "next";
import { publicGameRegistry } from "@/games/registry";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/games"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/learn"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/semiconductors"), changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/daily"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "monthly", priority: 0.3 },
  ];

  const games: MetadataRoute.Sitemap = publicGameRegistry.map((game) => ({
    url: absoluteUrl(`/games/${game.slug}`),
    changeFrequency: game.slug === "linebreak-daily" ? "daily" : "weekly",
    priority: game.lane === "Learn" ? 0.9 : 0.85,
  }));

  return [...core, ...games];
}
