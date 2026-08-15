export type ProvisionTenantInput = {
  name: string;
  slug: string;
  templateKey?: string;
  planKey?: string;
};

export type ProvisionTenantResult =
  | { ok: true; organizationId: string; slug: string }
  | { ok: false; error: string };

export type TenantLifecycleStatus = "active" | "suspended" | "archived";

export type PlatformAuditEntry = {
  organizationId: string;
  actorType: "user" | "ai" | "system";
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  after?: Record<string, unknown>;
  source?: string;
};

export type PlanDefinition = {
  key: string;
  name: string;
  limits: Record<string, unknown>;
};
