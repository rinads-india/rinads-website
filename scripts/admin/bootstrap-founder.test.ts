import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  bootstrapFounder,
  CANONICAL_BOOTSTRAP_REDIRECT,
  DEFAULT_FOUNDER_EMAIL,
  parseBootstrapEmail,
  PLATFORM_ORG_SLUG,
  requireServiceRoleEnv,
  type BootstrapAdminClient,
} from "./bootstrap-founder-lib.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("bootstrap-founder CLI args", () => {
  it("defaults to the founder email and allows override", () => {
    assert.equal(parseBootstrapEmail([]), DEFAULT_FOUNDER_EMAIL);
    assert.equal(parseBootstrapEmail(["--email", "Other@RINADS.com"]), "other@rinads.com");
  });

  it("requires service-role credentials", () => {
    assert.throws(() => requireServiceRoleEnv({}), /SUPABASE_SERVICE_ROLE_KEY/);
    assert.deepEqual(
      requireServiceRoleEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
      }),
      {
        url: "https://example.supabase.co",
        serviceRoleKey: "service-role",
      }
    );
  });
});

describe("bootstrap-founder static safety", () => {
  it("does not generate or log passwords/secrets", () => {
    const cli = readFileSync(join(here, "bootstrap-founder.ts"), "utf8");
    const lib = readFileSync(join(here, "bootstrap-founder-lib.ts"), "utf8");
    const source = `${cli}\n${lib}`;
    assert.doesNotMatch(source, /generatePassword/i);
    assert.doesNotMatch(source, /randomBytes/);
    assert.doesNotMatch(source, /crypto\.randomUUID\(\).*password/);
    assert.doesNotMatch(source, /createUser\(/);
    assert.doesNotMatch(source, /console\.log\([^\n]*password/i);
    assert.doesNotMatch(source, /console\.log\([^\n]*SERVICE_ROLE/);
    assert.match(source, /inviteUserByEmail/);
    assert.match(source, /rinads\.india@gmail\.com/);
    assert.equal(CANONICAL_BOOTSTRAP_REDIRECT, "https://www.rinads.com/auth/callback?next=/auth/reset-password");
    assert.equal(PLATFORM_ORG_SLUG, "rinads-platform");
  });
});

function createFakeAdmin(options?: { existingUser?: boolean; existingOrg?: boolean }): BootstrapAdminClient {
  const users = options?.existingUser
    ? [{ id: "user-1", email: DEFAULT_FOUNDER_EMAIL }]
    : [];
  const orgs = options?.existingOrg
    ? [{ id: "org-1", slug: PLATFORM_ORG_SLUG, name: "RINADS Platform" }]
    : [];
  const members: Record<string, unknown>[] = [];
  const audits: Record<string, unknown>[] = [];

  return {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users }, error: null }),
        inviteUserByEmail: async (email) => {
          const user = { id: "user-invited", email };
          users.push(user);
          return { data: { user }, error: null };
        },
      },
    },
    from: (table: string) => ({
      select: (_columns: string) => {
        const filters: Record<string, string> = {};
        const builder = {
          eq(column: string, value: string) {
            filters[column] = value;
            return builder;
          },
          async maybeSingle() {
            if (table === "organizations") {
              return { data: orgs[0] ?? null, error: null };
            }
            if (table === "roles") {
              return { data: { id: "role-founder", key: "founder" }, error: null };
            }
            if (table === "organization_members") {
              return { data: members[0] ?? null, error: null };
            }
            return { data: null, error: null };
          },
        };
        return builder;
      },
      insert: (row: Record<string, unknown>) => {
        const promise = Promise.resolve({ data: row, error: null }) as Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }> & {
          select: (columns: string) => {
            single: () => Promise<{
              data: Record<string, unknown> | null;
              error: { message: string } | null;
            }>;
          };
        };
        if (table === "organizations") {
          const created = { id: "org-created", ...row };
          orgs.push(created);
          promise.select = () => ({
            single: async () => ({ data: created, error: null }),
          });
        } else if (table === "organization_members") {
          members.push(row);
          promise.select = () => ({
            single: async () => ({ data: row, error: null }),
          });
        } else if (table === "audit_logs") {
          audits.push(row);
          promise.select = () => ({
            single: async () => ({ data: row, error: null }),
          });
        } else {
          promise.select = () => ({
            single: async () => ({ data: row, error: null }),
          });
        }
        return promise;
      },
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  };
}

describe("bootstrapFounder", () => {
  it("invites missing users and creates the platform org", async () => {
    const result = await bootstrapFounder(createFakeAdmin(), DEFAULT_FOUNDER_EMAIL);
    assert.equal(result.email, DEFAULT_FOUNDER_EMAIL);
    assert.equal(result.invited, true);
    assert.equal(result.organizationCreated, true);
    assert.equal(result.membershipCreated, true);
  });

  it("is idempotent when the founder and org already exist", async () => {
    const result = await bootstrapFounder(
      createFakeAdmin({ existingUser: true, existingOrg: true }),
      DEFAULT_FOUNDER_EMAIL
    );
    assert.equal(result.invited, false);
    assert.equal(result.organizationCreated, false);
    assert.equal(result.userId, "user-1");
    assert.equal(result.organizationId, "org-1");
  });
});
