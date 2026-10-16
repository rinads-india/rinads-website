import { selectOsHomeData } from "@/lib/os-home/select-home-data";
import { OsHomePageSwitch } from "@/components/os/OsHomePageSwitch";

/**
 * Home landing — command centre. Auth + tenant destination resolution run in layout.
 */
export default async function OsHomePage() {
  const data = await selectOsHomeData();

  return (
    <main id="main">
      <OsHomePageSwitch data={data} />
    </main>
  );
}
