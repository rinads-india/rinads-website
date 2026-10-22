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
 * Wix app credentials are server-only. Never expose the app secret or webhook
 * verification key to the browser. The app ID is intentionally public once an
 * install URL is enabled.
 */
export function getWixConfigurationStatus(): WixConfigurationStatus {
  const appId = process.env.WIX_APP_ID?.trim();
  const appSecret = process.env.WIX_APP_SECRET?.trim();
  const webhookPublicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY?.trim();
  const configured = Boolean(appId && appSecret && webhookPublicKey);

  return {
    configured,
    installUrl: configured && appId
      ? `https://www.wix.com/app-installer?appId=${encodeURIComponent(appId)}`
      : null,
  };
}
