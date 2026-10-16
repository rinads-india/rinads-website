import { selectOsHomeData } from "@/lib/os-home/select-home-data";
import { OsHomeContent } from "@/components/os/OsHomeContent";
import { HomeAttention } from "@/components/os/company/HomeAttention";

/**
 * Home landing — command centre. Auth + tenant destination resolution run in layout.
 */
export default async function OsHomePage() {
  const data = await selectOsHomeData();

  return (
    <main id="main" className="flex flex-col gap-4">
      <HomeAttention />
      <OsHomeContent data={data} />
    </main>
  );
}
