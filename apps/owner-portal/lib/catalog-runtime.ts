import "server-only";

import {
  loadCommerceStoreFromSupabase,
  type CommerceSupabaseClient,
} from "@rinads/commerce-server";
import { commerce, demoContext } from "@/lib/commerce";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { getCommerceContextFromTenancy, isDemoMode } from "@/lib/tenancy";

export async function loadOwnerCatalogRuntime() {
  if (isDemoMode()) {
    return {
      demo: true as const,
      ctx: demoContext(),
      store: commerce.repo.getStore(),
    };
  }

  const supabase = await createOwnerServerClient();
  const ctx = await getCommerceContextFromTenancy(async () => supabase);
  const store = await loadCommerceStoreFromSupabase(
    supabase as unknown as CommerceSupabaseClient,
    ctx.organizationId
  );

  if (!store) {
    throw new Error("Unable to load the active organization's commerce catalog.");
  }

  return {
    demo: false as const,
    ctx,
    store,
  };
}
