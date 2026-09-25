"use client";

import type { OsHomeData } from "@/lib/os-home/types";
import { OsDashboardHero } from "@/components/os/OsDashboardHero";
import { WorkspaceStatusBanner } from "./WorkspaceStatusBanner";
import { AttentionSummary } from "./AttentionSummary";
import { RinpoDailyBrief } from "./RinpoDailyBrief";
import { BusinessPulse } from "./BusinessPulse";
import { ContinueWorking } from "./ContinueWorking";
import { RoomsOverview } from "./RoomsOverview";

export function OsHomeCommandCentre({ data }: { data: OsHomeData }) {
  return (
    <div className="flex flex-col gap-4">
      <WorkspaceStatusBanner workspace={data.workspace} />
      <OsDashboardHero />
      <AttentionSummary items={data.attention} error={data.errors.attention} />
      <RinpoDailyBrief brief={data.brief} />
      <BusinessPulse metrics={data.pulse} error={data.errors.pulse} />
      <ContinueWorking entities={data.continueWorking} error={data.errors.continueWorking} />
      <RoomsOverview rooms={data.rooms} error={data.errors.rooms} />
    </div>
  );
}
