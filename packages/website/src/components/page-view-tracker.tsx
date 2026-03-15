"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import type { Locale } from "@/lib/i18n/locales";

type PageViewTrackerProps = {
  locale: Locale;
};

export function PageViewTracker({ locale }: PageViewTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    trackEvent(
      "page_view",
      buildAnalyticsPayload({
        locale,
        page: pathname,
        referrer: document.referrer || "direct",
      }),
    );
  }, [locale, pathname]);

  return null;
}
