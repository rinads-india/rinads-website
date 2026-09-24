import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getCustomersModuleDestinations } from "@/lib/os-module-destinations";

export default function OsCustomersPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getCustomersModuleDestinations()} />
    </main>
  );
}
