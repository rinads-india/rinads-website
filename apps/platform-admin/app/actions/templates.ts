"use server";

import { TemplateMarketplaceService } from "@rinads/platform";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";
import { VERTICAL_TEMPLATES } from "@rinads/platform";

export async function listTemplatesAction(): Promise<
  | { ok: true; templates: { key: string; name: string; description: string; category: string; isPublished: boolean }[] }
  | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) {
      return {
        ok: true,
        templates: Object.entries(VERTICAL_TEMPLATES).map(([key, meta]) => ({
          key,
          name: meta.name,
          description: meta.description,
          category: meta.category,
          isPublished: meta.isPublished,
        })),
      };
    }
    const service = createPlatformServiceClient();
    const svc = new TemplateMarketplaceService(service as never);
    const templates = await svc.listPublished();
    return { ok: true, templates };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
