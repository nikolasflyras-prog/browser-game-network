"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturePageView } from "@/lib/analytics/client";

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    capturePageView();
  }, [pathname]);

  return null;
}
