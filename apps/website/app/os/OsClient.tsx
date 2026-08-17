"use client";

import { Suspense } from "react";
import "@/app/os/os.css";
import { BusinessOsShell } from "@/components/os/BusinessOsShell";

function OsShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#dfe8df] text-gray-800">
      Loading Business OS…
    </div>
  );
}

export function OsClient() {
  return (
    <Suspense fallback={<OsShellFallback />}>
      <BusinessOsShell />
    </Suspense>
  );
}
