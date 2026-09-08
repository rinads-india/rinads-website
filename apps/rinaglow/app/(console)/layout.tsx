import { isPrivilegedRoleKey } from "@rinads/permissions";
import { RinaglowNav } from "@/components/RinaglowNav";
import { RinpoCommandBar } from "@/components/RinpoCommandBar";
import { requireTenancy } from "@/lib/tenancy";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const tenancy = await requireTenancy();
  const membership = tenancy.memberships.find((m) => m.organizationId === tenancy.organizationId);
  const canApprove = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("org.manage");

  return (
    <>
      <RinaglowNav organizationName={membership?.organizationName} roleKey={tenancy.roleKey} />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-32">{children}</main>
      <RinpoCommandBar canApprove={canApprove} />
    </>
  );
}
