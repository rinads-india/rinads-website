import { redirect } from "next/navigation";
import { PlatformNav } from "@/components/PlatformNav";
import { loadPlatformAccess } from "@/lib/tenancy";
import { DemoDataNotice } from "@/components/DemoDataNotice";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const access = await loadPlatformAccess();
  if (access.status === "unauthenticated") {
    redirect("/login");
  }
  if (access.status === "forbidden") {
    redirect("/forbidden");
  }

  return (
    <>
      <PlatformNav />
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
        <SignOutButton />
      </div>
      {access.demo ? <DemoDataNotice workspace="platform-admin" /> : null}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
