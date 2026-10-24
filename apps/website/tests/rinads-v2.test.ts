import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isIndustryRegistrySchemaUnavailable,
  resolveTemplateForBusinessType,
  ONBOARDING_MODULES,
} from "../lib/onboarding-config";
import {
  getOsRinpoPrompts,
  resolveOsModuleFromParam,
  getGreetingForHour,
} from "../lib/os-rinpo-prompts";

describe("onboarding-config", () => {
  it("routes specialized industries directly and generic industries through starter-business", () => {
    assert.equal(resolveTemplateForBusinessType("landscape"), "ambady-nursery");
    assert.equal(resolveTemplateForBusinessType("salon"), "salon-os");
    assert.equal(resolveTemplateForBusinessType("retail"), "starter-business");
    assert.equal(resolveTemplateForBusinessType("consulting"), "starter-business");
  });

  it("defines six onboarding modules", () => {
    assert.equal(ONBOARDING_MODULES.length, 6);
  });

  it("defers only missing Industry Registry schema errors", () => {
    assert.equal(
      isIndustryRegistrySchemaUnavailable(
        "Could not find the 'primary_industry_id' column of 'organization_settings' in the schema cache"
      ),
      true
    );
    assert.equal(
      isIndustryRegistrySchemaUnavailable(
        'relation "public.organization_industries" does not exist'
      ),
      true
    );
    assert.equal(
      isIndustryRegistrySchemaUnavailable("new row violates row-level security policy"),
      false
    );
    assert.equal(
      isIndustryRegistrySchemaUnavailable("permission denied for table organization_industries"),
      false
    );
  });
});

describe("os-rinpo-prompts", () => {
  it("returns contextual prompts for home module", () => {
    const prompts = getOsRinpoPrompts("home");
    assert.ok(prompts[0]?.includes("focus"));
    assert.equal(prompts.length, 3);
  });

  it("resolves module query param", () => {
    assert.equal(resolveOsModuleFromParam("leads"), "leads");
    assert.equal(resolveOsModuleFromParam("dashboard"), "home");
    assert.equal(resolveOsModuleFromParam("invalid"), "home");
  });

  it("returns time-based greeting", () => {
    assert.match(getGreetingForHour(new Date("2026-01-01T09:00:00")), /Good morning/);
    assert.match(getGreetingForHour(new Date("2026-01-01T14:00:00")), /Good afternoon/);
    assert.match(getGreetingForHour(new Date("2026-01-01T20:00:00")), /Good evening/);
  });
});
