import { analyticsEventNamesFor } from "./analytics-contracts";
import {
  futureGamePromotionManifests,
  type FutureGamePromotionManifest,
  type FutureGamePromotionSlug,
} from "./promotion-manifests";

export type ResolvedFutureGamePromotionManifest = Omit<FutureGamePromotionManifest, "analytics"> & {
  analytics: ReturnType<typeof analyticsEventNamesFor>;
};

export function resolvedPromotionManifest(slug: FutureGamePromotionSlug): ResolvedFutureGamePromotionManifest {
  const manifest = futureGamePromotionManifests[slug];
  return {
    ...manifest,
    analytics: analyticsEventNamesFor(slug),
  };
}

export const resolvedFutureGamePromotionManifests = Object.fromEntries(
  (Object.keys(futureGamePromotionManifests) as FutureGamePromotionSlug[]).map((slug) => [slug, resolvedPromotionManifest(slug)]),
) as Record<FutureGamePromotionSlug, ResolvedFutureGamePromotionManifest>;
