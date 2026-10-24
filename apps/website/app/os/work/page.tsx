import { CompanyOsRouteSwitch } from "@/components/os/company/CompanyOsRouteSwitch";
import { CompanyWorkHub } from "@/components/os/company/CompanyWorkHub";
import { BusinessTasksLive } from "@/components/os/business/BusinessTasksLive";

export default function OsWorkPage() {
  return (
    <main id="main">
      <CompanyOsRouteSwitch
        company={<CompanyWorkHub />}
        business={<BusinessTasksLive />}
      />
    </main>
  );
}
