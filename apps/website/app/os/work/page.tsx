import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getWorkModuleDestinations } from "@/lib/os-module-destinations";

export default function OsWorkPage() {
  return (
    <main id="main">
      <OsModuleBridge config={getWorkModuleDestinations()} />
    </main>
  );
}
