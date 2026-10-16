import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getWorkModuleDestinations } from "@/lib/os-module-destinations";
import { CompanyOsRouteSwitch } from "@/components/os/company/CompanyOsRouteSwitch";
import { CompanyWorkHub } from "@/components/os/company/CompanyWorkHub";

export default function OsWorkPage() {
  return (
    <main id="main">
      <CompanyOsRouteSwitch
        company={<CompanyWorkHub />}
        business={<OsModuleBridge config={getWorkModuleDestinations()} />}
      />
    </main>
  );
}
