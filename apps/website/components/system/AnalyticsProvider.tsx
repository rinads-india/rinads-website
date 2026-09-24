"use client";

import { useEffect, type ReactNode } from "react";
import {
  registerAnalyticsSink,
  type AnalyticsEvent,
  type AnalyticsProps,
} from "@/lib/analytics";

/**
 * Production-safe analytics sink.
 * Registers a no-throw receiver so trackMarketing events are captured.
 * When NEXT_PUBLIC_ANALYTICS_ENDPOINT is set, posts sanitized events there.
 * Never sends secrets/prompts (already stripped by track()).
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

    const sink = (event: AnalyticsEvent, props?: AnalyticsProps) => {
      if (typeof window !== "undefined") {
        const detail = { event, props, at: Date.now() };
        window.dispatchEvent(new CustomEvent("rinads:analytics", { detail }));
        const w = window as Window & { dataLayer?: unknown[]; rinadsAnalytics?: unknown[] };
        w.dataLayer = w.dataLayer ?? [];
        w.dataLayer.push({ event, ...props });
        w.rinadsAnalytics = w.rinadsAnalytics ?? [];
        w.rinadsAnalytics.push(detail);
      }

      if (!endpoint) return;

      void fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, props, source: "rinads-website" }),
        keepalive: true,
      }).catch(() => {
        // Analytics must never break UX.
      });
    };

    registerAnalyticsSink(sink);
    return () => registerAnalyticsSink(null);
  }, []);

  return <>{children}</>;
}
