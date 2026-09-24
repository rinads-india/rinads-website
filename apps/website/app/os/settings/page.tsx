import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getSettingsModuleDestinations } from "@/lib/os-module-destinations";

export default function OsSettingsPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getSettingsModuleDestinations()} />
    </main>
  );
}
