import "server-only";

import { demoContext } from "./commerce";
import { getStorefrontContext, isDemoMode } from "./tenancy";
import { createStorefrontServerClient } from "./supabase/server";

export async function resolveCommerceContext() {
  if (isDemoMode()) return demoContext();
  return getStorefrontContext(createStorefrontServerClient);
}
