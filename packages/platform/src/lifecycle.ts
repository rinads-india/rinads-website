import type { TenantLifecycleStatus } from "./types";

export type LifecycleResult =
  | { ok: true; status: TenantLifecycleStatus }
  | { ok: false; error: string };

export async function setOrganizationStatus(
  rpc: (args: { p_org_id: string; p_status: string }) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>,
  organizationId: string,
  status: TenantLifecycleStatus
): Promise<LifecycleResult> {
  const { error } = await rpc({ p_org_id: organizationId, p_status: status });
  if (error) return { ok: false, error: error.message };
  return { ok: true, status };
}

export function canAccessTenant(status: TenantLifecycleStatus): boolean {
  return status === "active";
}
