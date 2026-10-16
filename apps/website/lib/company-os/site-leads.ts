import "server-only";
import type { SiteLeadRow, SiteLeadSource } from "@rinads/company-os-server";

/**
 * Read-only source of website form leads (`site_leads` is deny-all to every end-user role and has
 * no organisation column). This is the ONLY place in /os that touches the service credential, and
 * it only ever issues a bounded SELECT. It is enabled only when BOTH are set:
 *   SUPABASE_SERVICE_ROLE_KEY and COMPANY_OS_SITE_LEADS_ORG_ID (the organisation allowed to import).
 * Otherwise the import tool fails closed ("not configured").
 */
export function createSiteLeadSource(organizationId: string): SiteLeadSource | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowedOrg = process.env.COMPANY_OS_SITE_LEADS_ORG_ID;
  if (!url || !key || !allowedOrg || allowedOrg !== organizationId) return undefined;

  return {
    async fetchRecent(limit: number): Promise<SiteLeadRow[]> {
      const q = new URLSearchParams({
        select: "id,name,work_email,company,problem,budget,timeline,outcome,created_at",
        order: "created_at.desc",
        limit: String(Math.min(Math.max(limit, 1), 100)),
      });
      const res = await fetch(`${url}/rest/v1/site_leads?${q}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!res.ok) throw new Error(`Website leads could not be read (HTTP ${res.status}).`);
      return (await res.json()) as SiteLeadRow[];
    },
  };
}
