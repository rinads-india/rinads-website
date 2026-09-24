"use client";

import { useEffect, type ReactNode } from "react";
import {
  registerAnalyticsSink,
  type AnalyticsEvent,
  type AnalyticsProps,
} from "@/lib/analytics";

declare global {
  interface Window {
    dataLayer?: unknown[];
    rinadsAnalytics?: unknown[];
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";

function ensureGtmSnippet(containerId: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById("rinads-gtm")) return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.id = "rinads-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
}

/**
 * Production-safe analytics sink.
 * Registers a no-throw receiver so trackMarketing events are captured.
 * When NEXT_PUBLIC_ANALYTICS_ENDPOINT is set, posts sanitized events there.
 * When NEXT_PUBLIC_GTM_ID is set, injects the GTM snippet once (no invented ID).
 * Never sends secrets/prompts (already stripped by track()).
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

    if (GTM_ID) {
      ensureGtmSnippet(GTM_ID);
    }

    const sink = (event: AnalyticsEvent, props?: AnalyticsProps) => {
      if (typeof window !== "undefined") {
        const detail = { event, props, at: Date.now() };
        window.dispatchEvent(new CustomEvent("rinads:analytics", { detail }));
        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push({ event, ...props });
        window.rinadsAnalytics = window.rinadsAnalytics ?? [];
        window.rinadsAnalytics.push(detail);
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

  return (
    <>
      {GTM_ID ? (
        <noscript>
          <iframe
            title="Google Tag Manager"
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID)}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      ) : null}
      {children}
    </>
  );
}
