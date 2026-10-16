"use client";

import type { OsHomeData } from "@/lib/os-home/types";
import { OsHomeContent } from "@/components/os/OsHomeContent";
import { CompanyHome } from "@/components/os/company/CompanyHome";
import { useCompanyOsMode } from "@/components/os/CompanyOsModeContext";

export function OsHomePageSwitch({ data }: { data: OsHomeData }) {
  const companyOsMode = useCompanyOsMode();
  if (companyOsMode) return <CompanyHome />;
  return <OsHomeContent data={data} />;
}
