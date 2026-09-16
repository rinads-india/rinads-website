import {
  SalonAutomationService,
  SalonNotificationService,
  SalonRepository,
  type SalonSupabaseClient,
} from "@rinads/salon-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSalonDeps } from "@/lib/salon";
import { resolveTenancyContext } from "@/lib/tenancy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    limit?: number;
    organizationIds?: string[];
  };
  const limit = Number.isFinite(body.limit) ? Math.max(1, Math.min(Number(body.limit), 100)) : 50;
  const workerToken = process.env.RINADS_REVIEWS_AUTOMATION_TOKEN;
  const isWorker =
    Boolean(workerToken) &&
    request.headers.get("authorization") === `Bearer ${workerToken}`;

  if (isWorker) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const organizationIds = [...new Set(
      (Array.isArray(body.organizationIds) ? body.organizationIds : [])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )].slice(0, 50);
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Worker database credentials are not configured." }, { status: 503 });
    }
    if (organizationIds.length === 0) {
      return NextResponse.json({ error: "An explicit organization allowlist is required." }, { status: 400 });
    }
    const client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    }) as unknown as SalonSupabaseClient;
    const repo = new SalonRepository(client);
    const notifications = new SalonNotificationService(client);
    const publicBaseUrl =
      process.env.NEXT_PUBLIC_RINAGLOW_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "");
    const automations = new SalonAutomationService(
      client,
      repo,
      notifications,
      undefined,
      { publicBaseUrl }
    );
    const results = await Promise.all(
      organizationIds.map(async (organizationId) => ({
        organizationId,
        result: await automations.processDue(organizationId, { limit }),
      }))
    );
    return NextResponse.json({ results });
  }

  const tenancy = await resolveTenancyContext();
  if (!tenancy) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenancy.permissions.includes("salon.reviews.manage") && !["founder", "super_admin"].includes(tenancy.roleKey ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { automations } = await getSalonDeps();
  const result = await automations.processDue(tenancy.organizationId, { limit });
  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ error: result.error.message }, { status: 500 });
}

