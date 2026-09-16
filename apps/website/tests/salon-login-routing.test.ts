import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  ONBOARDING_PATH,
  OS_PATH,
  resolveRinaglowOrigin,
  resolveTenantAwareDestination,
} from "../lib/post-auth-destination";

const active = (organizationId: string) => ({
  organizationId,
  organizationStatus: "active" as const,
});

const productionSalonInput = {
  rinaglowUrl: "https://glow.rinads.com",
  production: true,
  authCookieDomain: ".rinads.com",
};

describe("tenant-aware post-auth routing", () => {
  it("routes a selected salon vertical to R GLOW", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("retail"), active("salon")],
        activeOrgCookie: "salon",
        settingsByOrganizationId: {
          salon: { verticalKey: "salon-os" },
          retail: { verticalKey: "generic-retail" },
        },
        ...productionSalonInput,
      }),
      "https://glow.rinads.com/calendar"
    );
  });

  it("uses the sole active membership and the salon migration fallback", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("salon")],
        settingsByOrganizationId: {
          salon: { verticalKey: "generic-retail", businessType: "salon" },
        },
        ...productionSalonInput,
      }),
      "https://glow.rinads.com/calendar"
    );
  });

  it("keeps ambiguous multi-org users in /os without a valid selection", () => {
    for (const activeOrgCookie of [undefined, "unknown"]) {
      assert.equal(
        resolveTenantAwareDestination({
          memberships: [active("one"), active("two")],
          activeOrgCookie,
          settingsByOrganizationId: {
            one: { verticalKey: "salon-os" },
            two: { verticalKey: "salon-os" },
          },
          ...productionSalonInput,
        }),
        OS_PATH
      );
    }
  });

  it("keeps non-salon users in /os and sends no-membership users to onboarding", () => {
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [active("retail")],
        settingsByOrganizationId: { retail: { verticalKey: "generic-retail" } },
        ...productionSalonInput,
      }),
      OS_PATH
    );
    assert.equal(
      resolveTenantAwareDestination({
        memberships: [],
        settingsByOrganizationId: {},
        ...productionSalonInput,
      }),
      ONBOARDING_PATH
    );
  });

  it("fails closed for missing, malformed, untrusted, or unsafe Production config", () => {
    for (const rinaglowUrl of [
      undefined,
      "not a url",
      "http://glow.rinads.com",
      "https://evil.example",
      "http://localhost:3005",
      "https://glow.rinads.com/path",
    ]) {
      assert.equal(
        resolveTenantAwareDestination({
          memberships: [active("salon")],
          settingsByOrganizationId: { salon: { verticalKey: "salon-os" } },
          rinaglowUrl,
          production: true,
          authCookieDomain: ".rinads.com",
        }),
        OS_PATH
      );
    }
    assert.equal(
      resolveRinaglowOrigin({
        value: "https://glow.rinads.com",
        production: true,
        authCookieDomain: ".example.com",
      }),
      undefined
    );
  });

  it("permits a localhost R GLOW origin only outside Production", () => {
    assert.equal(
      resolveRinaglowOrigin({ value: "http://localhost:3005", production: false }),
      "http://localhost:3005"
    );
  });
});

describe("/os and onboarding defense contracts", () => {
  it("runs tenant destination resolution in the /os server page", () => {
    const source = readFileSync(join(process.cwd(), "app/os/page.tsx"), "utf8");
    assert.match(source, /resolveDestinationForMemberships/);
    assert.match(source, /if \(destination !== "\/os"\)/);
  });

  it("uses shared template validation and supports salon-os in both provisioners", () => {
    const website = readFileSync(
      join(process.cwd(), "app/onboarding/actions/onboarding.ts"),
      "utf8"
    );
    const admin = readFileSync(
      join(process.cwd(), "../platform-admin/app/actions/tenants.ts"),
      "utf8"
    );
    assert.match(website, /parseVerticalTemplateKey\(input\.templateKey\)/);
    assert.match(admin, /parseVerticalTemplateKey\(input\.templateKey\)/);
  });

  it("validates membership and resolves actual vertical after provisioning", () => {
    const source = readFileSync(
      join(process.cwd(), "app/onboarding/actions/onboarding.ts"),
      "utf8"
    );
    assert.match(source, /finalizeProvisioningDestinationAction/);
    assert.match(source, /membership\.organizationId === organizationId/);
    assert.match(source, /resolveDestinationForMemberships/);
    const clientSource = readFileSync(
      join(process.cwd(), "app/onboarding/provisioning/ProvisioningStatusClient.tsx"),
      "utf8"
    );
    assert.match(clientSource, /Open R GLOW/);
  });
});

describe("salon vertical repair migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "../../supabase/migrations/20260916100003_fix_salon_vertical_routing.sql"
    ),
    "utf8"
  );

  it("repairs only mismatched salon settings and audits repaired rows", () => {
    assert.match(sql, /business_type = 'salon'/i);
    assert.match(sql, /vertical_key IS DISTINCT FROM 'salon-os'/i);
    assert.match(sql, /SET vertical_key = 'salon-os'/i);
    assert.match(sql, /INSERT INTO public\.audit_logs/i);
    assert.match(sql, /FROM repaired/i);
  });

  it("does not weaken RLS or recreate policies", () => {
    assert.doesNotMatch(sql, /disable row level security/i);
    assert.doesNotMatch(sql, /drop policy/i);
    assert.doesNotMatch(sql, /create policy/i);
  });
});

describe("cross-app auth cookie wiring", () => {
  it("wires shared cookie options into browser, server, and middleware clients", () => {
    const files = [
      "lib/supabase/browser.ts",
      "lib/supabase/server.ts",
      "middleware.ts",
      "../rinaglow/lib/supabase/browser.ts",
      "../rinaglow/lib/supabase/server.ts",
      "../rinaglow/middleware.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      assert.match(
        source,
        /AuthCookieOptions|sharedAuthCookieOptions/,
        `${file} must apply shared auth cookie options`
      );
    }
  });

  it("documents browser-readable auth cookies and HttpOnly active-org cookies", () => {
    const docs = readFileSync(
      join(process.cwd(), "../../docs/deployment/VERCEL_RINAGLOW.md"),
      "utf8"
    );
    assert.match(docs, /auth session cookies intentionally are not `HttpOnly`/);
    assert.match(docs, /active\s+organization cookie remains `HttpOnly`/);
  });
});
