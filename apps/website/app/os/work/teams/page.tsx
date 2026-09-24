import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getWorkTeamsDestinations } from "@/lib/os-module-destinations";

export default function OsWorkTeamsPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getWorkTeamsDestinations()} />
    </main>
  );
}
