import { redirect } from "next/navigation";
import { loadPlatformAccess } from "@/lib/tenancy";

export default async function RinpoControlLayout({ children }: { children: React.ReactNode }) {
  const access = await loadPlatformAccess();
  if (access.status === "unauthenticated") redirect("/login?next=%2Frinpo");
  if (
    access.status === "forbidden" ||
    (access.tenancy.roleKey !== "founder" && access.tenancy.roleKey !== "super_admin")
  ) {
    redirect("/forbidden");
  }

  return <main>{children}</main>;
}
