"use client";

import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export function CompanyOsWorkspaceStub({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-28 lg:pb-6">
      <CompanyOsPanel title={title}>
        <CompanyOsDemoNotice />
        <p className="mt-4 text-sm text-gray-800">
          Workspace scaffolding — Phase 4+. This route is reserved for the {title} workspace; no
          live operator tools are mounted here yet.
        </p>
      </CompanyOsPanel>
    </div>
  );
}
