import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getMoneyModuleDestinations } from "@/lib/os-module-destinations";

export default function OsMoneyPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getMoneyModuleDestinations()} />
    </main>
  );
}
