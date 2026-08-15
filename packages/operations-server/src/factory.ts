import type { CommerceRepository } from "@rinads/commerce";
import type { OperationsRepository } from "@rinads/operations";
import {
  getSharedCommerceRepository,
  createAmbadySeedStore,
  AMBADY_ORG_ID,
  createOrgScopedCommerceRepository,
  createSupabaseCommerceRepository,
  type CommerceSupabaseClient,
} from "@rinads/commerce-server";
import { createInMemoryOperationsRepository } from "./memory";
import { createSupabaseOperationsRepository, type OperationsSupabaseClient } from "./supabase";

export type RepositoryBundle = {
  commerceRepo: CommerceRepository;
  opsRepo: OperationsRepository;
  organizationId: string;
  mode: "demo" | "supabase" | "org-scoped";
};

export function isDemoStoreMode(): boolean {
  return process.env.USE_DEMO_STORE === "1" || process.env.USE_SUPABASE !== "1";
}

export function isSupabasePersistenceMode(): boolean {
  return process.env.USE_SUPABASE === "1";
}

/** Default demo bundle — single Ambady in-memory store (Phase 10 compat). */
export function createDemoRepositoryBundle(): RepositoryBundle {
  return {
    commerceRepo: getSharedCommerceRepository(),
    opsRepo: createInMemoryOperationsRepository(),
    organizationId: AMBADY_ORG_ID,
    mode: "demo",
  };
}

/** Org-scoped in-memory bundle for multi-tenant local dev without Supabase. */
export function createOrgScopedRepositoryBundle(organizationId: string): RepositoryBundle {
  return {
    commerceRepo: createOrgScopedCommerceRepository(organizationId),
    opsRepo: createSupabaseOperationsRepository({ organizationId }),
    organizationId,
    mode: "org-scoped",
  };
}

/** Supabase-backed bundle for production path. */
export function createSupabaseRepositoryBundle(
  organizationId: string,
  client: CommerceSupabaseClient & OperationsSupabaseClient,
  seeds?: { commerce?: ReturnType<typeof createAmbadySeedStore>; operations?: Parameters<typeof createInMemoryOperationsRepository>[0] }
): RepositoryBundle {
  return {
    commerceRepo: createSupabaseCommerceRepository({
      organizationId,
      client,
      initialStore: seeds?.commerce,
    }),
    opsRepo: createSupabaseOperationsRepository({
      organizationId,
      client,
      initialStore: seeds?.operations,
    }),
    organizationId,
    mode: "supabase",
  };
}

export function resolveRepositoryBundle(
  organizationId?: string,
  supabaseClient?: CommerceSupabaseClient & OperationsSupabaseClient
): RepositoryBundle {
  if (isDemoStoreMode() || !organizationId) {
    return createDemoRepositoryBundle();
  }
  if (supabaseClient) {
    return createSupabaseRepositoryBundle(organizationId, supabaseClient);
  }
  return createOrgScopedRepositoryBundle(organizationId);
}
