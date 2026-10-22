import type { Integration } from "@/lib/content/case-studies";

export const WIX_INTEGRATION: Integration = {
  slug: "wix",
  name: "Wix",
  category: "Commerce & Experience",
  summary:
    "Connect Wix sites, contacts, commerce, and bookings to RINADS through a governed self-managed app flow.",
  status: "private_preview",
  productStatus: "preview",
  href: "/integrations/wix",
};

type WixConfigurationStatus = {
  configured: boolean;
  installUrl: string | null;
};

/**
 * Wix app credentials and the internal RINADS event sink are server-only.
 * The installer stays disabled until both authentication and verified event
 * delivery are configured so an install cannot silently drop lifecycle events.
 */
export function getWixConfigurationStatus(): WixConfigurationStatus {
  const appId = process.env.WIX_APP_ID?.trim();
  const appSecret = process.env.WIX_APP_SECRET?.trim();
  const webhookPublicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY?.trim();
  const eventSinkUrl = process.env.RINADS_WIX_EVENT_SINK_URL?.trim();
  const eventSinkSecret = process.env.RINADS_WIX_EVENT_SINK_SECRET?.trim();
  const configured = Boolean(
    appId && appSecret && webhookPublicKey && eventSinkUrl && eventSinkSecret,
  );

  return {
    configured,
    installUrl: configured && appId
      ? `https://www.wix.com/app-installer?appId=${encodeURIComponent(appId)}`
      : null,
  };
}
