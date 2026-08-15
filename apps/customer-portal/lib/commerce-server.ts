import "server-only";

import type { CommerceContext } from "@rinads/commerce";
import { portalContext } from "./commerce";
import { getPortalContext, isDemoMode } from "./tenancy";
import { createCustomerPortalServerClient } from "./supabase/server";

export async function resolvePortalContext(): Promise<CommerceContext> {
  if (isDemoMode()) return portalContext();
  return getPortalContext(createCustomerPortalServerClient);
}
