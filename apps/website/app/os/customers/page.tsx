import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { getCustomersModuleDestinations } from "@/lib/os-module-destinations";
import { CompanyOsRouteSwitch } from "@/components/os/company/CompanyOsRouteSwitch";
import { CompanyCustomersList } from "@/components/os/company/CompanyCustomersList";

export default function OsCustomersPage() {
  return (
    <main id="main">
      <CompanyOsRouteSwitch
        company={<CompanyCustomersList />}
        business={<OsModuleBridge config={getCustomersModuleDestinations()} />}
      />
    </main>
  );
}
