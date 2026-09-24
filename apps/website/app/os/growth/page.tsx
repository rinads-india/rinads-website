import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getGrowthModuleDestinations } from "@/lib/os-module-destinations";

export default function OsGrowthPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getGrowthModuleDestinations()} />
    </main>
  );
}
