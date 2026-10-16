import { selectOsHomeData } from "@/lib/os-home/select-home-data";
import { OsHomePageSwitch } from "@/components/os/OsHomePageSwitch";
import { HomeAttention } from "@/components/os/company/HomeAttention";

/**
 * Home landing — command centre. Auth + tenant destination resolution run in layout.
 * Live Company OS organisations additionally get a real, permission-filtered attention strip
 * (renders nothing for Business OS tenants and in demo mode).
 */
export default async function OsHomePage() {
  const data = await selectOsHomeData();

  return (
    <main id="main" className="flex flex-col gap-4">
      <HomeAttention />
      <OsHomePageSwitch data={data} />
    </main>
  );
}
