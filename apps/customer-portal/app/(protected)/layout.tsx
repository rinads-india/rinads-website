import { redirect } from "next/navigation";
import { PortalNav } from "@/components/PortalNav";
import { RouteAwareRinpoPanel } from "@/components/RouteAwareRinpoPanel";
import { loadCustomerAccess } from "@/lib/tenancy";
import { createCustomerPortalServerClient } from "@/lib/supabase/server";
import { WorkspaceDataNotice } from "@/components/WorkspaceDataNotice";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const access = await loadCustomerAccess(createCustomerPortalServerClient);
  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="flex justify-end px-6 pt-3">
        <SignOutButton />
      </div>
      <WorkspaceDataNotice demo={access.demo} />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="lg:w-56 lg:shrink-0">
          <PortalNav />
        </div>
        <main id="main" className="flex-1 p-6 lg:p-8">
          {children}
        </main>
        <div className="lg:w-80 lg:shrink-0">
          <RouteAwareRinpoPanel />
        </div>
      </div>
    </>
  );
}
