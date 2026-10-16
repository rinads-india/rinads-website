"use client";

import type { ReactNode } from "react";
import { useCompanyOsMode } from "@/components/os/CompanyOsModeContext";

export function CompanyOsRouteSwitch({
  company,
  business,
}: {
  company: ReactNode;
  business: ReactNode;
}) {
  const companyOsMode = useCompanyOsMode();
  return companyOsMode ? company : business;
}
