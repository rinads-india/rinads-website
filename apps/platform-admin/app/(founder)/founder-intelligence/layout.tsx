import { redirect } from "next/navigation";
import { loadPlatformAccess } from "@/lib/tenancy";

export default async function FounderIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await loadPlatformAccess();
  if (access.status === "unauthenticated") redirect("/login?next=%2Ffounder-intelligence");
  if (
    access.status === "forbidden" ||
    (access.tenancy.roleKey !== "founder" && access.tenancy.roleKey !== "super_admin")
  ) {
    redirect("/forbidden");
  }

  return <main className="founder-intelligence-shell">{children}</main>;
}
