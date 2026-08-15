import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedTenantBundle } from "../src/templates/index";
import { TemplateMarketplaceService } from "../src/templates/marketplace";
import { runPendingProvisioningJobs } from "../src/provisioning-worker";

describe("Phase 12 marketplace", () => {
  it("seeds generic-retail template", () => {
    const bundle = seedTenantBundle("org_retail_001", "generic-retail");
    assert.equal(bundle.commerce.products.length, 1);
    assert.equal(bundle.operations.locations.length, 1);
  });

  it("loads templates from code fallback", async () => {
    const svc = new TemplateMarketplaceService();
    const templates = await svc.listPublished();
    assert.ok(templates.length >= 2);
    assert.ok(templates.some((t) => t.key === "generic-retail"));
  });

  it("processes pending provisioning jobs with mock client", async () => {
    const jobs = [
      {
        id: "job_1",
        organization_id: "org_job_1",
        template_key: "generic-retail",
        status: "pending" as const,
      },
    ];
    const tables = new Map<string, Record<string, unknown>[]>();

    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: async (col: string, val: string) => {
            if (table === "tenant_provisioning_jobs" && col === "status" && val === "pending") {
              return { data: jobs, error: null };
            }
            if (table === "products" && col === "organization_id") {
              return { data: tables.get("products") ?? [], error: null };
            }
            if (table === "inventory_locations" && col === "organization_id") {
              return { data: tables.get("inventory_locations") ?? [], error: null };
            }
            return { data: [], error: null };
          },
        }),
        update: (row: Record<string, unknown>) => ({
          eq: async () => {
            if (table === "tenant_provisioning_jobs") {
              const id = jobs[0]!.id;
              jobs[0] = { ...jobs[0]!, ...row, id } as typeof jobs[0];
            }
            return { error: null };
          },
        }),
        upsert: async (rows: Record<string, unknown>[]) => {
          const existing = tables.get(table) ?? [];
          tables.set(table, [...existing, ...rows]);
          return { error: null };
        },
      }),
    };

    const result = await runPendingProvisioningJobs(client as never);
    assert.equal(result.processed, 1);
    assert.equal(jobs[0]?.status, "completed");
  });
});
