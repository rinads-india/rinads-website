import { CompanyOsRouteSwitch } from "@/components/os/company/CompanyOsRouteSwitch";
import { CompanyCustomersList } from "@/components/os/company/CompanyCustomersList";
import { BusinessCustomersLive } from "@/components/os/business/BusinessCustomersLive";

export default function OsCustomersPage() {
  return (
    <main id="main">
      <CompanyOsRouteSwitch
        company={<CompanyCustomersList />}
        business={<BusinessCustomersLive />}
      />
    </main>
  );
}
