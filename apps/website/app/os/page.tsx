import { selectOsHomeData } from "@/lib/os-home/select-home-data";
import { OsHomeContent } from "@/components/os/OsHomeContent";

/**
 * Home landing — command centre. Auth + tenant destination resolution run in layout.
 */
export default async function OsHomePage() {
  const data = await selectOsHomeData();

  return (
    <main id="main">
      <OsHomeContent data={data} />
    </main>
  );
}
