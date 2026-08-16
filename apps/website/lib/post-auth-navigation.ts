"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { resolvePostAuthDestinationAction } from "@/app/actions/post-auth";
import { sanitizeNextPath } from "@/lib/post-auth-destination";

export async function navigateAfterAuth(
  router: AppRouterInstance,
  nextParam?: string | null
): Promise<void> {
  const safeNext = sanitizeNextPath(nextParam ?? null);
  if (safeNext) {
    router.push(safeNext);
    return;
  }

  const destination = await resolvePostAuthDestinationAction();
  router.push(destination);
}
