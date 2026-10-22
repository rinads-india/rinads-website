import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, ProductStatus } from "@/components/system";
import { getWixConfigurationStatus } from "@/lib/integrations/wix";

export const metadata: Metadata = {
  title: "Wix Integration | RINADS",
  description:
    "Connect Wix commerce, contacts, bookings, and site activity to RINADS Intelligence and RINPO through the RINADS Wix connector.",
};

const CAPABILITIES = [
  {
    title: "Commerce",
    description: "Normalize Wix order events into the canonical RINADS business event stream.",
  },
  {
    title: "Customers & leads",
    description: "Bring Wix contact signals into a tenant-bound, governed RINADS customer context.",
  },
  {
    title: "Bookings",
    description: "Connect booking activity to industry workflows such as R GLOW without making Wix the system of record.",
  },
  {
    title: "RINPO intelligence",
    description: "Turn verified channel events into recommendations and approved actions through RINADS Intelligence.",
  },
] as const;

const FLOW = [
  "Wix business",
  "Verified webhook",
  "Tenant-bound event inbox",
  "Business Graph + RI",
  "RINPO Runtime",
] as const;

const CONNECTION_MESSAGES: Record<string, { title: string; body: string }> = {
  connected: {
    title: "Wix instance connected to the active RINADS organization",
    body: "The tenant boundary is stored. RINADS will still keep Wix in Private Preview until live provider credentials, the production event sink, and a real business event are verified end to end.",
  },
  failed: {
    title: "Wix connection was not changed",
    body: "The signed Wix instance was valid enough to reach the binding step, but RINADS could not complete the tenant mapping. No cross-tenant fallback is attempted.",
  },
  "invalid-instance": {
    title: "Wix instance verification failed",
    body: "RINADS rejected the request rather than trusting an unsigned or tampered instance identifier.",
  },
  "auth-required": {
    title: "RINADS sign-in is required",
    body: "Sign in, select the organization you intend to connect, and reopen the Wix installation flow.",
  },
  forbidden: {
    title: "Organization manager permission required",
    body: "Only a RINADS user with org.manage can bind a Wix installation to the active tenant.",
  },
  "not-configured": {
    title: "Wix server credentials are not configured",
    body: "The provider remains Private Preview and no tenant connection was changed.",
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WixIntegrationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const connectionMessage = CONNECTION_MESSAGES[first(params.connection) ?? ""];
  const wix = getWixConfigurationStatus();
  const activationHref = wix.installUrl ?? "/contact?intent=implementation&integration=wix";

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Wix · Private preview"
        headline="Connect your Wix business to RINADS."
        summary="Keep Wix as the customer-facing website, commerce, or booking layer while RINADS becomes the governed intelligence and operating layer behind it."
        primaryHref={activationHref}
        primaryLabel={wix.installUrl ? "Install RINADS on Wix" : "Activate Wix private preview"}
        secondaryHref="/integrations"
        secondaryLabel="All integrations"
      />

      {connectionMessage ? (
        <section className="px-6 pb-6 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-semibold text-foreground">{connectionMessage.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{connectionMessage.body}</p>
          </div>
        </section>
      ) : null}

      <section className="px-6 pb-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl border border-white/10 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Production truth
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">RINADS-side connector surface is ready.</h2>
            </div>
            <ProductStatus status="preview" showDescription />
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted-foreground">
            The Wix provider connection remains a private preview until a RINADS-owned Wix app is configured with
            its server-side credentials, the production event sink is deployed, and a real Wix tenant passes the
            verified install → bind → event flow. No Wix credential is exposed to the browser.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {wix.configured ? "Wix activation path configured" : "Wix activation configuration required"}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Architecture</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Wix stays a channel. RI stays the control plane.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {FLOW.map((step, index) => (
              <div key={step} className="border border-white/10 p-5">
                <p className="text-xs text-muted-foreground">0{index + 1}</p>
                <p className="mt-2 font-semibold text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {CAPABILITIES.map((capability) => (
            <div key={capability.title} className="border border-white/10 p-6">
              <h3 className="text-lg font-bold text-foreground">{capability.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{capability.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl border border-white/10 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">MVP activation</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">What activates the real Wix connection</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="border border-white/10 p-5">
              <p className="font-semibold text-foreground">1. RINADS Wix app</p>
              <p className="mt-2 text-sm text-muted-foreground">Create and release the self-managed Wix app with only the pilot permissions required.</p>
            </div>
            <div className="border border-white/10 p-5">
              <p className="font-semibold text-foreground">2. Secure tenant binding</p>
              <p className="mt-2 text-sm text-muted-foreground">Verify Wix-signed instance data and require a RINADS organization manager to confirm the tenant boundary.</p>
            </div>
            <div className="border border-white/10 p-5">
              <p className="font-semibold text-foreground">3. Verified events</p>
              <p className="mt-2 text-sm text-muted-foreground">Persist events idempotently, quarantine unbound instances, and emit tenant-bound canonical events into Business Graph.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={activationHref}
              className="inline-flex items-center justify-center bg-rinads-primary px-5 py-3 text-sm font-semibold text-black"
            >
              {wix.installUrl ? "Install Wix connector" : "Request private preview"}
            </Link>
            <Link
              href="/contact?intent=implementation"
              className="inline-flex items-center justify-center border border-white/15 px-5 py-3 text-sm font-semibold text-foreground"
            >
              Talk to RINADS implementation
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl text-sm text-muted-foreground">
          Wix is an external platform. Availability of specific APIs and business objects depends on the Wix app
          permissions and the connected site&apos;s enabled Wix products.
        </div>
      </section>
    </MarketingPageShell>
  );
}
