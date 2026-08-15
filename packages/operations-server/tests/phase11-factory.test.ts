import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDemoRepositoryBundle,
  createOrgScopedRepositoryBundle,
  isDemoStoreMode,
  resolveRepositoryBundle,
} from "../src/factory";
import { AMBADY_ORG_ID } from "@rinads/commerce-server";

describe("repository factory", () => {
  it("defaults to demo mode when USE_SUPABASE is unset", () => {
    const prev = process.env.USE_SUPABASE;
    const prevDemo = process.env.USE_DEMO_STORE;
    delete process.env.USE_SUPABASE;
    process.env.USE_DEMO_STORE = "1";
    assert.equal(isDemoStoreMode(), true);
    const bundle = resolveRepositoryBundle();
    assert.equal(bundle.mode, "demo");
    assert.equal(bundle.organizationId, AMBADY_ORG_ID);
    process.env.USE_SUPABASE = prev;
    process.env.USE_DEMO_STORE = prevDemo;
  });

  it("creates org-scoped bundle for tenant id", () => {
    const bundle = createOrgScopedRepositoryBundle("org_test_tenant");
    assert.equal(bundle.organizationId, "org_test_tenant");
    assert.equal(bundle.mode, "org-scoped");
    const store = bundle.commerceRepo.getStore();
    assert.ok(store.products.length > 0);
  });

  it("demo bundle shares Ambady seed", () => {
    const a = createDemoRepositoryBundle();
    const b = createDemoRepositoryBundle();
    assert.equal(a.commerceRepo.getStore().products.length, b.commerceRepo.getStore().products.length);
  });
});
