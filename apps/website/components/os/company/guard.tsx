import type { ReactNode } from "react";
import { can } from "@rinads/company-os";
import { loadCompanyData, type CompanyData } from "@/lib/company-os/load";
import { NoAccess, NotReady } from "./ui";

export type Ready = Extract<CompanyData, { kind: "ready" }>;

/**
 * Every Company OS page starts here: live organisation required, then a permission check.
 * (The database independently enforces both via RLS — this only produces a clear page.)
 */
export async function guard(path: string, permission: string | null, title: string): Promise<{ ok: false; block: ReactNode } | { ok: true; data: Ready }> {
  const data = await loadCompanyData(path);
  if (data.kind !== "ready") return { ok: false, block: <NotReady kind={data.kind} /> };
  if (permission && !can(data.session.ctx, permission)) return { ok: false, block: <NoAccess title={title} permission={permission} /> };
  return { ok: true, data };
}
