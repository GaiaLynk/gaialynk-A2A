"use client";

import { useEffect } from "react";
import { buildAnalyticsPayload, inferDeviceType, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics/events";
import { setTrackAdapter } from "@/lib/analytics/track";

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

export function AnalyticsProvider() {
  useEffect(() => {
    let posthog: { capture: (event: string, payload: Record<string, unknown>) => void } | null = null;
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    if (posthogKey) {
      void import("posthog-js")
        .then((module) => {
          module.default.init(posthogKey, {
            api_host: posthogHost,
            capture_pageview: false,
            capture_pageleave: false,
          });
          posthog = module.default;
        })
        .catch(() => {
          posthog = null;
        });
    }

    setTrackAdapter((name: AnalyticsEventName, payload: AnalyticsPayload) => {
      const win = window as DataLayerWindow;
      if (!win.dataLayer) {
        win.dataLayer = [];
      }
      const normalized = buildAnalyticsPayload({
        ...payload,
        device_type: payload.device_type ?? inferDeviceType(window.innerWidth),
      });
      win.dataLayer.push({
        event: name,
        ...normalized,
      });
      void fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, payload: normalized }),
        keepalive: true,
      }).catch(() => null);
      if (posthog) {
        posthog.capture(name, normalized as Record<string, unknown>);
      }
    });
  }, []);

  return null;
}
