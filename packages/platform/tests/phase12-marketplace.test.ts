import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedTenantBundle } from "../src/templates/index";
import { TemplateMarketplaceService } from "../src/templates/marketplace";
import { runPendingProvisioningJobs } from "../src/provisioning-worker";
import type { ProvisioningJobRow } from "../src/runtime-jobs";

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
    assert.ok(templates.some((t) => t.key === "starter-business"));
    assert.ok(templates.some((t) => t.key === "generic-retail"));
  });

  function buildProvisioningClient(input: {
    jobs: ProvisioningJobRow[];
    subscriptionStatus: string;
    trialExpiresAt?: string;
  }) {
    const tables = new Map<string, Record<string, unknown>[]>();
    const auditRows: Record<string, unknown>[] = [];

    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: async (col: string, val: string) => {
            if (table === "tenant_provisioning_jobs" && col === "status") {
              return { data: input.jobs.filter((job) => job.status === val), error: null };
            }
            if (table === "organization_subscriptions" && col === "organization_id") {
              return { data: [{ status: input.subscriptionStatus }], error: null };
            }
            if (table === "trial_grants" && col === "organization_id") {
              return {
                data: input.trialExpiresAt
                  ? [{ expires_at: input.trialExpiresAt, revoked_at: null }]
                  : [],
                error: null,
              };
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
          eq: async (_col: string, val: string) => {
            if (table === "tenant_provisioning_jobs") {
              const index = input.jobs.findIndex((job) => job.id === val);
              if (index >= 0) input.jobs[index] = { ...input.jobs[index]!, ...row } as ProvisioningJobRow;
            }
            return { error: null };
          },
        }),
        insert: async (row: Record<string, unknown>) => {
          if (table === "audit_logs") auditRows.push(row);
          return { error: null };
        },
        upsert: async (rows: Record<string, unknown>[]) => {
          const existing = tables.get(table) ?? [];
          tables.set(table, [...existing, ...rows]);
          return { error: null };
        },
      }),
    };

    return { client, tables, auditRows };
  }

  it("processes pending provisioning jobs for an active paid subscription", async () => {
    const jobs: ProvisioningJobRow[] = [
      {
        id: "job_1",
        organization_id: "org_job_1",
        template_key: "starter-business",
        status: "pending",
      },
    ];
    const { client, auditRows } = buildProvisioningClient({
      jobs,
      subscriptionStatus: "active",
    });

    const result = await runPendingProvisioningJobs(client as never);
    assert.equal(result.processed, 1);
    assert.equal(result.blocked, 0);
    assert.equal(jobs[0]?.status, "completed");
    assert.equal(jobs[0]?.attempts, 1);
    assert.ok(auditRows.some((row) => row.action === "tenant.provisioning.completed"));
  });

  it("processes pending provisioning jobs for an unexpired governed trial", async () => {
    const jobs: ProvisioningJobRow[] = [
      {
        id: "job_trial",
        organization_id: "org_trial",
        template_key: "starter-business",
        status: "pending",
      },
    ];
    const { client } = buildProvisioningClient({
      jobs,
      subscriptionStatus: "trialing",
      trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = await runPendingProvisioningJobs(client as never);
    assert.equal(result.processed, 1);
    assert.equal(result.blocked, 0);
    assert.equal(jobs[0]?.status, "completed");
  });

  it("marks a job blocked when neither paid nor trial entitlement is active", async () => {
    const jobs: ProvisioningJobRow[] = [
      {
        id: "job_waiting_for_payment",
        organization_id: "org_waiting_for_payment",
        template_key: "starter-business",
        status: "pending",
      },
    ];
    const { client, tables } = buildProvisioningClient({
      jobs,
      subscriptionStatus: "trialing",
    });

    const result = await runPendingProvisioningJobs(client as never);
    assert.deepEqual(result, {
      processed: 0,
      failed: 0,
      blocked: 1,
      retrying: 0,
      deadLettered: 0,
    });
    assert.equal(jobs[0]?.status, "blocked");
    assert.equal(tables.get("products")?.length ?? 0, 0);
  });
});
