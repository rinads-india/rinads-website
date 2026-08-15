import "server-only";

export { getOwnerContext, resolveTenancyContext, isDemoMode } from "./tenancy";
export { createOwnerServerClient } from "./supabase/server";

import type { CommerceContext } from "@rinads/commerce";
import { demoContext } from "./commerce";
import { getOwnerContext, isDemoMode } from "./tenancy";
import { createOwnerServerClient } from "./supabase/server";

export async function resolveOwnerContext(): Promise<CommerceContext> {
  if (isDemoMode()) return demoContext();
  return getOwnerContext(createOwnerServerClient) as Promise<CommerceContext>;
}
