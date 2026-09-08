import { RinaglowNav } from "@/components/RinaglowNav";
import { requireTenancy } from "@/lib/tenancy";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const tenancy = await requireTenancy();
  const membership = tenancy.memberships.find((m) => m.organizationId === tenancy.organizationId);

  return (
    <>
      <RinaglowNav organizationName={membership?.organizationName} roleKey={tenancy.roleKey} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
