"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { isIndustryRegistrySchemaUnavailable } from "@/lib/onboarding-config";
import { provisionTenantViaRpc, seedTenantBundle, AMBADY_TENANT_SLUG, loadPublishedTemplates, parseVerticalTemplateKey } from "@rinads/platform";
import { getIndustry } from "@rinads/platform/industries";
import { seedOrgCommerceStore } from "@rinads/commerce-server";
import { createSupabaseOperationsRepository } from "@rinads/operations-server";
import { loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import { resolveDestinationForMemberships } from "@/lib/tenant-destination-server";
import { setActiveOrganizationAction } from "@/lib/org-context";

export async function listOnboardingTemplatesAction(): Promise<
  { ok: true; templates: { key: string; name: string; description: string }[] } | { ok: false; error: string }
> {
  if (!isSupabaseMode()) {
    const templates = await loadPublishedTemplates();
    return {
      ok: true,
      templates: templates.map((t) => ({ key: t.key, name: t.name, description: t.description })),
    };
  }
  try {
    const supabase = await createWebsiteServerClient();
    const templates = await loadPublishedTemplates(supabase as never);
    return {
      ok: true,
      templates: templates.map((t) => ({ key: t.key, name: t.name, description: t.description })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function provisionOrganizationAction(input: {
  name: string;
  slug: string;
  templateKey: string;
  selectedModules?: string[];
  businessType?: string;
  businessDescription?: string;
  businessStage?: string;
  websiteUrl?: string;
  countryCode?: string;
  stateRegion?: string;
  city?: string;
  employeeBand?: string;
  annualRevenueBand?: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) return { ok: false, error: "Name and slug are required." };

  let templateKey;
  try {
    templateKey = parseVerticalTemplateKey(input.templateKey);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown template" };
  }

  const selectedModules = input.selectedModules ?? [];
  const businessType = input.businessType ?? "other";
  if (!getIndustry(businessType)) {
    return { ok: false, error: "Unknown industry." };
  }

  if (!isSupabaseMode()) {
    const orgId = slug === AMBADY_TENANT_SLUG ? "org_ambady_demo" : `org_${slug.replace(/-/g, "_")}`;
    const bundle = seedTenantBundle(orgId, templateKey);
    seedOrgCommerceStore(orgId, bundle.commerce);
    createSupabaseOperationsRepository({ organizationId: orgId, initialStore: bundle.operations });
    return { ok: true, organizationId: orgId };
  }

  try {
    const supabase = await createWebsiteServerClient();
    const result = await provisionTenantViaRpc(
      async (args) => {
        const { data, error } = await (
          supabase as unknown as {
            rpc: (
              fn: string,
              args: Record<string, string>
            ) => Promise<{ data: { id: string; slug: string } | null; error: { message: string } | null }>;
          }
        ).rpc("provision_tenant", args);
        return { data, error };
      },
      { name, slug, templateKey, planKey: "starter" }
    );

    if (!result.ok) return { ok: false, error: result.error };
    if (!result.organizationId) return { ok: false, error: "Provision failed" };

    const typedClient = supabase as unknown as {
      from: (table: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
        upsert: (
          row: Record<string, unknown>,
          options?: { onConflict?: string }
        ) => Promise<{ error: { message: string } | null }>;
      };
    };

    const { error: coreSettingsError } = await typedClient
      .from("organization_settings")
      .update({
        enabled_modules: selectedModules,
        business_type: businessType,
      })
      .eq("organization_id", result.organizationId);

    if (coreSettingsError) {
      return { ok: false, error: `Workspace created, but core settings failed: ${coreSettingsError.message}` };
    }

    const { error: profileError } = await typedClient
      .from("organization_settings")
      .update({
        primary_industry_id: businessType,
        business_description: input.businessDescription?.trim() || null,
        business_stage: input.businessStage?.trim() || null,
        website_url: input.websiteUrl?.trim() || null,
        country_code: input.countryCode?.trim() || null,
        state_region: input.stateRegion?.trim() || null,
        city: input.city?.trim() || null,
        employee_band: input.employeeBand?.trim() || null,
        annual_revenue_band: input.annualRevenueBand?.trim() || null,
      })
      .eq("organization_id", result.organizationId);

    if (profileError && !isIndustryRegistrySchemaUnavailable(profileError.message)) {
      return { ok: false, error: `Workspace created, but business profile failed: ${profileError.message}` };
    }
    if (profileError) {
      console.warn("Industry Registry profile persistence deferred until the production migration ledger is reconciled.");
    }

    const { error: industryError } = await typedClient
      .from("organization_industries")
      .upsert(
        {
          organization_id: result.organizationId,
          industry_id: businessType,
          is_primary: true,
          source: "onboarding",
        },
        { onConflict: "organization_id,industry_id" }
      );

    if (industryError && !isIndustryRegistrySchemaUnavailable(industryError.message)) {
      return { ok: false, error: `Workspace created, but industry mapping failed: ${industryError.message}` };
    }
    if (industryError) {
      console.warn("Industry mapping persistence deferred until the production migration ledger is reconciled.");
    }

    const activeOrgResult = await setActiveOrganizationAction(result.organizationId);
    if (!activeOrgResult.ok) {
      console.warn("Workspace created but active organization selection was deferred.");
    }

    return { ok: true, organizationId: result.organizationId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function grantTrialAction(
  organizationId: string
): Promise<{ ok: true; expiresAt: string } | { ok: false; error: string }> {
  // Server-side launch gate. NEXT_PUBLIC_* only controls presentation; this
  // server-only flag is authoritative so a client cannot turn trials on.
  if (process.env.TRIAL_SIGNUP_ENABLED !== "1") {
    return { ok: false, error: "Self-serve trial activation is not enabled for this release." };
  }
  if (!isSupabaseMode()) {
    return { ok: false, error: "Trial activation requires the production tenancy backend." };
  }

  try {
    const supabase = await createWebsiteServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, error: "Not authenticated" };

    const result = await (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, string>
        ) => Promise<{
          data: { expires_at?: string } | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("grant_trial", { p_org_id: organizationId });

    if (result.error) return { ok: false, error: result.error.message };
    if (!result.data?.expires_at) return { ok: false, error: "Trial grant did not return an expiry." };

    const activeOrgResult = await setActiveOrganizationAction(organizationId);
    if (!activeOrgResult.ok) return { ok: false, error: activeOrgResult.error };

    return { ok: true, expiresAt: String(result.data.expires_at) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error" };
  }
}

export async function finalizeProvisioningDestinationAction(
  organizationId: string
): Promise<{ ok: true; destination: string } | { ok: false; error: string }> {
  if (!isSupabaseMode()) {
    return { ok: true, destination: "/os" };
  }
  try {
    const supabase = await createWebsiteServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { ok: false, error: "Not authenticated" };

    const memberships = await loadMemberships(
      supabase as unknown as TenancySupabaseClient,
      user.id
    );
    const isActiveMember = memberships.some(
      (membership) =>
        membership.organizationId === organizationId &&
        membership.organizationStatus === "active"
    );
    if (!isActiveMember) {
      return { ok: false, error: "You are not an active member of this organization" };
    }

    const cookieResult = await setActiveOrganizationAction(organizationId);
    if (!cookieResult.ok) return cookieResult;

    const destination = await resolveDestinationForMemberships(
      supabase as unknown as TenancySupabaseClient,
      memberships,
      organizationId
    );
    return { ok: true, destination };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function getProvisioningJobStatusAction(organizationId: string): Promise<
  { ok: true; status: string; errorMessage?: string } | { ok: false; error: string }
> {
  if (!isSupabaseMode()) {
    return { ok: true, status: "completed" };
  }
  try {
    const supabase = await createWebsiteServerClient();
    const typedClient = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => Promise<{
            data: Record<string, unknown>[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };

    const jobResult = await typedClient
      .from("tenant_provisioning_jobs")
      .select("status, error_message")
      .eq("organization_id", organizationId);

    if (jobResult.error) return { ok: false, error: jobResult.error.message };
    const job = jobResult.data?.[0];
    if (job?.status) {
      return {
        ok: true,
        status: String(job.status),
        errorMessage: job.error_message ? String(job.error_message) : undefined,
      };
    }

    const subscriptionResult = await typedClient
      .from("organization_subscriptions")
      .select("status")
      .eq("organization_id", organizationId);
    if (subscriptionResult.error) {
      return { ok: false, error: subscriptionResult.error.message };
    }

    const subscriptionStatus = subscriptionResult.data?.[0]?.status
      ? String(subscriptionResult.data[0].status)
      : undefined;

    return {
      ok: true,
      status: subscriptionStatus === "active" ? "activation_pending" : "awaiting_payment",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
