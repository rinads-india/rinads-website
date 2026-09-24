import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getWorkProjectsDestinations } from "@/lib/os-module-destinations";

export default function OsWorkProjectsPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getWorkProjectsDestinations()} />
    </main>
  );
}
