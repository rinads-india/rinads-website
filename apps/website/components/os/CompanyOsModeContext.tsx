"use client";

import { createContext, useContext } from "react";

type CompanyOsModeContextValue = {
  companyOsMode: boolean;
};

const CompanyOsModeContext = createContext<CompanyOsModeContextValue>({
  companyOsMode: false,
});

export function CompanyOsModeProvider({
  companyOsMode,
  children,
}: {
  companyOsMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <CompanyOsModeContext.Provider value={{ companyOsMode }}>
      {children}
    </CompanyOsModeContext.Provider>
  );
}

export function useCompanyOsMode(): boolean {
  return useContext(CompanyOsModeContext).companyOsMode;
}
