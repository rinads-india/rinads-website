import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getAutomateModuleDestinations } from "@/lib/os-module-destinations";

export default function OsAutomatePage() {
  return (
    <main id="main">
      <OsModuleBridge config={getAutomateModuleDestinations()} />
    </main>
  );
}
