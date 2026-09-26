import { redirect } from "next/navigation";
import { OwnerNav } from "@/components/OwnerNav";
import { loadOwnerAccess } from "@/lib/tenancy";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { WorkspaceDataNotice } from "@/components/WorkspaceDataNotice";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const access = await loadOwnerAccess(createOwnerServerClient);
  if (access.status === "unauthenticated") {
    redirect("/login");
  }
  if (access.status === "forbidden") {
    redirect("/forbidden");
  }

  return (
    <>
      <OwnerNav role={access.tenancy.roleKey} />
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
        <SignOutButton />
      </div>
      <WorkspaceDataNotice demo={access.demo} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
