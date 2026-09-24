"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { OsAuthGate } from "./OsAuthGate";
import { OsNavPanel } from "./OsNavPanel";
import { OsRinpoDock } from "./OsRinpoDock";
import { OsTopBar } from "./OsTopBar";
import { BusinessOSMobileNav } from "./BusinessOSMobileNav";
import { useOsGuide } from "@/hooks/useOsGuide";
import {
  resolveOsModuleFromParam,
  resolveOsModuleFromPathname,
} from "@/lib/os-rinpo-prompts";

const OS_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4";

type OsShellContextValue = {
  askRinpo: (prompt: string) => void;
};

const OsShellContext = createContext<OsShellContextValue | null>(null);

export function useOsShell() {
  const ctx = useContext(OsShellContext);
  if (!ctx) throw new Error("useOsShell must be used within BusinessOsShell");
  return ctx;
}

type BusinessOsShellProps = {
  children: React.ReactNode;
};

export function BusinessOsShell({ children }: BusinessOsShellProps) {
  const pathname = usePathname() ?? "/os";
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const growModule = searchParams.get("module") === "grow";
  const paramModule = resolveOsModuleFromParam(searchParams.get("module"));
  const pathModule = resolveOsModuleFromPathname(pathname);
  const rinpoModule = growModule ? "growth" : searchParams.get("module") ? paramModule : pathModule;
  const rinpoWelcome = welcome || growModule;
  const rinpoWelcomeMessage = growModule
    ? "Welcome to RINADS Grow in Business OS. Open Growth to browse marketing packages and manage campaigns."
    : undefined;
  const [rinpoOpen, setRinpoOpen] = useState(welcome || growModule);
  const [rinpoSeedPrompt, setRinpoSeedPrompt] = useState<string | null>(null);

  useOsGuide();

  const askRinpo = useCallback((prompt: string) => {
    setRinpoOpen(true);
    setRinpoSeedPrompt(prompt);
  }, []);

  return (
    <OsAuthGate>
      <OsShellContext.Provider value={{ askRinpo }}>
        <div className="os-page relative min-h-screen overflow-hidden bg-[#dfe8df] p-3 sm:p-4 md:p-6">
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={OS_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-emerald-950/25" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-24px)] max-w-7xl flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)] lg:pb-0">
            <OsTopBar />

            <div className="flex flex-1 flex-col gap-4 lg:flex-row">
              <OsNavPanel />
              <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
            </div>
          </div>

          <BusinessOSMobileNav />

          <OsRinpoDock
            welcome={rinpoWelcome}
            welcomeMessage={rinpoWelcomeMessage}
            module={rinpoModule}
            expanded={rinpoOpen}
            onExpandedChange={setRinpoOpen}
            seedPrompt={rinpoSeedPrompt}
            onSeedPromptHandled={() => setRinpoSeedPrompt(null)}
          />
        </div>
      </OsShellContext.Provider>
    </OsAuthGate>
  );
}
