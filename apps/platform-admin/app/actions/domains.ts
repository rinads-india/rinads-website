"use server";

import {
  generateVerificationToken,
  buildTxtVerificationRecord,
  addDomainToVercelProject,
  getVercelDomainConfigFromEnv,
  transitionDomainStatus,
} from "@rinads/domains";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";

export async function listDomainsAction(organizationId: string): Promise<
  | {
      ok: true;
      domains: {
        id: string;
        hostname: string;
        status: string;
        verificationToken: string;
        verificationMethod: string;
      }[];
    }
  | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) {
      return {
        ok: true,
        domains: [
          {
            id: "dom_demo",
            hostname: "shop.example.com",
            status: "pending",
            verificationToken: "rinads-verify-demo",
            verificationMethod: "txt",
          },
        ],
      };
    }
    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("organization_domains")
      .select("id, hostname, status, verification_token, verification_method")
      .eq("organization_id", organizationId);

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      domains: (data ?? []).map((row) => ({
        id: String(row.id),
        hostname: String(row.hostname),
        status: String(row.status),
        verificationToken: String(row.verification_token ?? ""),
        verificationMethod: String(row.verification_method ?? "txt"),
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function addDomainAction(
  organizationId: string,
  hostname: string
): Promise<{ ok: true; instructions: { host: string; value: string } } | { ok: false; error: string }> {
  try {
    await requirePlatformTenancy();
    const token = generateVerificationToken();
    const instructions = buildTxtVerificationRecord(token);

    if (isDemoMode()) {
      return { ok: true, instructions };
    }

    const service = createPlatformServiceClient();
    const { error } = await (
      service.from("organization_domains") as unknown as {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      }
    ).insert({
      organization_id: organizationId,
      hostname: hostname.toLowerCase(),
      status: "pending",
      verification_token: token,
      verification_method: "txt",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, instructions };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function verifyDomainAction(
  domainId: string,
  hostname: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) return { ok: true };

    const vercel = addDomainToVercelProject(hostname, getVercelDomainConfigFromEnv());
    const vercelResult = await vercel;
    if (!vercelResult.ok) return { ok: false, error: vercelResult.error };

    const domain = {
      id: domainId,
      organizationId: "",
      hostname,
      status: "pending" as const,
      verificationMethod: "txt" as const,
      verificationToken: "",
    };
    const next = transitionDomainStatus(domain, "verified");
    if ("error" in next) return { ok: false, error: next.error };

    const service = createPlatformServiceClient();
    const { error } = await (
      service.from("organization_domains") as unknown as {
        update: (row: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .update({
        status: "active",
        verified_at: new Date().toISOString(),
        vercel_domain_id: vercelResult.domainId,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", domainId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
