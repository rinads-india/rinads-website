"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getOsCards, getOsNavItems, type OsNavId } from "@/lib/os-modules";
import { resolveOsModuleFromParam } from "@/lib/os-rinpo-prompts";
import { OsAuthGate } from "./OsAuthGate";
import { OsCardGrid } from "./OsCardGrid";
import { OsDashboardHero } from "./OsDashboardHero";
import { OsNavPanel } from "./OsNavPanel";
import { OsPresenceRow } from "./OsPresenceRow";
import { OsRinpoDock } from "./OsRinpoDock";
import { OsSystemStatus } from "./OsSystemStatus";
import { OsTopBar } from "./OsTopBar";
import { useOsGuide } from "@/hooks/useOsGuide";

const OS_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4";

export function BusinessOsShell() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const growModule = searchParams.get("module") === "grow";
  const rinpoModule = resolveOsModuleFromParam(searchParams.get("module"));
  const rinpoWelcome = welcome || growModule;
  const rinpoWelcomeMessage = growModule
    ? "Welcome to RINADS Grow in Business OS. Open the Grow card to browse marketing packages and manage campaigns."
    : undefined;
  const [activeNav, setActiveNav] = useState<OsNavId>("dashboard");
  const [view, setView] = useState<"dashboard" | "rooms">("dashboard");
  const [rinpoOpen, setRinpoOpen] = useState(welcome || growModule);
  const [rinpoSeedPrompt, setRinpoSeedPrompt] = useState<string | null>(null);

  const navItems = useMemo(() => getOsNavItems(user?.role ?? "client"), [user?.role]);
  const cards = useMemo(() => getOsCards(user?.role ?? "client"), [user?.role]);

  useOsGuide();

  return (
    <OsAuthGate>
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

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-24px)] max-w-7xl flex-col gap-4 sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)]">
          <OsTopBar view={view} onViewChange={setView} />

          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <OsNavPanel items={navItems} activeId={activeNav} onSelect={setActiveNav} />

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {view === "dashboard" && (
                <OsDashboardHero
                  onAskRinpo={(prompt) => {
                    setRinpoOpen(true);
                    setRinpoSeedPrompt(prompt);
                  }}
                />
              )}
              <div className="flex flex-1 flex-col gap-4 xl:flex-row">
                <OsCardGrid cards={cards} view={view} />
                <OsSystemStatus />
              </div>
              <OsPresenceRow />
            </div>
          </div>
        </div>

        <OsRinpoDock
          welcome={rinpoWelcome}
          welcomeMessage={rinpoWelcomeMessage}
          module={growModule ? "marketing" : rinpoModule}
          expanded={rinpoOpen}
          onExpandedChange={setRinpoOpen}
          seedPrompt={rinpoSeedPrompt}
          onSeedPromptHandled={() => setRinpoSeedPrompt(null)}
        />
      </div>
    </OsAuthGate>
  );
}
