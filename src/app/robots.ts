import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV;

  if (!isProduction) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/games/system-check"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
