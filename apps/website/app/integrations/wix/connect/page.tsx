import type { Metadata } from "next";
import Link from "next/link";
import { parseSignedWixInstance } from "@/lib/integrations/wix-instance";
import { resolveWebsiteTenancy } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connect Wix | RINADS",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WixConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const signedInstance = first(params.signedInstance) ?? first(params.instance);
  const appSecret = process.env.WIX_APP_SECRET?.trim();
  const instance = signedInstance && appSecret
    ? parseSignedWixInstance(signedInstance, appSecret)
    : null;
  const tenancy = await resolveWebsiteTenancy();
  const canManage = Boolean(tenancy?.permissions.includes("org.manage"));

  const panel = !appSecret
    ? {
        title: "Wix connector is not configured",
        body: "RINADS is keeping this integration in Private Preview until the server-side Wix app credentials are configured.",
      }
    : !signedInstance || !instance
      ? {
          title: "Wix verification failed",
          body: "The Wix app instance is missing or its signature could not be verified. No tenant connection was changed.",
        }
      : !tenancy
        ? {
            title: "RINADS sign-in required",
            body: "Sign in to RINADS, select the organization you want to connect, then reopen the Wix connection flow.",
          }
        : !canManage
          ? {
              title: "Organization manager required",
              body: "Your active RINADS role cannot manage integrations for this organization. No tenant connection was changed.",
            }
          : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/integrations/wix" className="text-sm text-zinc-400 hover:text-white">
          ← Wix integration
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:p-10">
          {panel ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Private Preview</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{panel.title}</h1>
              <p className="mt-4 text-zinc-300">{panel.body}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Verified Wix app instance</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">Connect Wix to this RINADS organization?</h1>
              <p className="mt-4 text-zinc-300">
                RINADS verified the Wix-signed app instance. Confirm to bind it to the active organization
                <strong className="text-white"> {tenancy?.organizationSlug}</strong>. This is the tenant boundary used for all future Wix events.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Provider</span>
                  <span className="font-medium text-white">Wix</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span>RINADS organization</span>
                  <span className="font-medium text-white">{tenancy?.organizationSlug}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span>Instance verification</span>
                  <span className="font-medium text-emerald-300">Signature valid</span>
                </div>
              </div>

              <form action="/api/integrations/wix/bind" method="post" className="mt-8">
                <input type="hidden" name="signedInstance" value={signedInstance} />
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-semibold text-black transition hover:bg-zinc-200"
                >
                  Confirm connection
                </button>
              </form>

              <p className="mt-5 text-xs leading-5 text-zinc-500">
                RINADS will not bind a plaintext Wix instance ID. The signed instance is verified again when you confirm.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
