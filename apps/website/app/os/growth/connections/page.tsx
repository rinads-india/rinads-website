/**
 * /os/growth/connections — Social Connections dashboard
 * Server component: fetches initial connections and resolves tenancy.
 * All mutations happen client-side via API routes.
 */
import { redirect } from "next/navigation";
import { requireOsShellAccess } from "@/lib/os-shell-access";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import { capabilityTierFromRoleKey } from "@/lib/os-org-role";
import { tierAtLeast } from "@/lib/os-org-role";
import { listConnections } from "@/lib/social-connections/connection";
import { getAllProviderMeta } from "@/lib/social-connections/providers/registry";
import { loadTenancyContext } from "@rinads/tenancy";
import { SocialConnectionsClientShell } from "./SocialConnectionsClientShell";
import type { RoleKey } from "@rinads/permissions";

export const dynamic = "force-dynamic";

export default async function SocialConnectionsPage() {
  // Require OS shell access
  const access = await requireOsShellAccess("/os/growth/connections");

  if (!isSupabaseMode()) {
    return (
      <main id="main" className="p-6">
        <p className="text-white/50 text-sm">
          Social Connections requires Supabase mode. Enable Supabase to use this feature.
        </p>
      </main>
    );
  }

  // Resolve tenancy
  const supabase = await createWebsiteServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/os");

  const ctx = await loadTenancyContext(supabase as never, { userId: user.id, email: user.email });
  const tier = capabilityTierFromRoleKey(ctx.roleKey as RoleKey);

  // Minimum: staff+
  if (!tierAtLeast(tier, "staff")) {
    redirect("/os/growth");
  }

  // Fetch initial connections server-side
  const service = getSocialServiceClient();
  const connections = await listConnections(service, ctx.organizationId).catch(() => []);

  const allProviders = getAllProviderMeta();

  return (
    <main id="main" className="p-4 sm:p-6 max-w-5xl mx-auto">
      <SocialConnectionsClientShell
        initialConnections={connections}
        allProviders={allProviders}
        organizationId={ctx.organizationId}
        orgName={ctx.organizationId}
        tier={tier}
        canDisconnect={tierAtLeast(tier, "admin")}
        canApprove={tierAtLeast(tier, "staff")}
        initialAuditEntries={[]}
        initialPendingJobs={[]}
      />
    </main>
  );
}
