import {
  createSupabaseLogisticsRuntimeRepository,
  type LogisticsSupabaseClient,
} from "@rinads/operations-server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

export type TenantLogisticsProviderSnapshot = {
  providerKey: string;
  enabled: boolean;
  priority: number;
  capabilities: string[];
  credentialSource: string;
  verificationState: string;
};

export type TenantLogisticsPolicySnapshot = {
  strategy: string;
  autonomyMode: string;
  maxCostMinor: number | null;
  maxEtaHours: number | null;
  humanApprovalDeclaredValueMinor: number;
  humanApprovalCodMinor: number;
  requireApprovalForHighValue: boolean;
  requireApprovalForFirstProviderUse: boolean;
};

export type TenantLogisticsSnapshot = {
  source: "supabase" | "not_enforced" | "unavailable";
  providers: TenantLogisticsProviderSnapshot[];
  policy: TenantLogisticsPolicySnapshot | null;
};

export async function getTenantLogisticsSnapshot(
  organizationId: string | null
): Promise<TenantLogisticsSnapshot> {
  if (!organizationId || !isSupabaseMode()) {
    return { source: "not_enforced", providers: [], policy: null };
  }

  try {
    const supabase = await createWebsiteServerClient();
    const repository = createSupabaseLogisticsRuntimeRepository(
      supabase as unknown as LogisticsSupabaseClient
    );
    const [providers, policy] = await Promise.all([
      repository.listProviderConfigs(organizationId),
      repository.getRoutingPolicy(organizationId),
    ]);

    return {
      source: "supabase",
      providers: providers.map((provider) => ({
        providerKey: provider.providerKey,
        enabled: provider.enabled,
        priority: provider.priority,
        capabilities: provider.capabilities,
        credentialSource: provider.credentialSource,
        verificationState: provider.verificationState,
      })),
      policy: policy
        ? {
            strategy: policy.strategy,
            autonomyMode: policy.autonomyMode,
            maxCostMinor: policy.maxCostMinor ?? null,
            maxEtaHours: policy.maxEtaHours ?? null,
            humanApprovalDeclaredValueMinor: policy.humanApprovalDeclaredValueMinor,
            humanApprovalCodMinor: policy.humanApprovalCodMinor,
            requireApprovalForHighValue: policy.requireApprovalForHighValue,
            requireApprovalForFirstProviderUse: policy.requireApprovalForFirstProviderUse,
          }
        : null,
    };
  } catch {
    // Fail closed and avoid leaking RLS/database implementation details into the UI.
    return { source: "unavailable", providers: [], policy: null };
  }
}
