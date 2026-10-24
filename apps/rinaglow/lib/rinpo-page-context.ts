export type RinpoPageContext = {
  area?: string;
  defaultBranchId?: string;
  selectedAppointmentId?: string;
  selectedSaleId?: string;
  selectedCustomerId?: string;
};

function areaFromPathname(pathname: string): string {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const labels: Record<string, string> = {
    dashboard: "Today",
    "front-desk": "Front Desk",
    calendar: "Calendar",
    pos: "POS",
    inventory: "Inventory",
    services: "Services",
    staff: "Staff",
    clients: "Clients",
    growth: "Growth",
    loyalty: "Loyalty",
    campaigns: "Campaigns",
    communications: "Communications",
    settings: "Settings",
  };
  return labels[firstSegment] ?? firstSegment.replace(/-/g, " ");
}

export function getRinpoPageContext(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">
): RinpoPageContext {
  const customerMatch = pathname.match(/^\/clients\/([^/]+)$/);
  return {
    area: areaFromPathname(pathname),
    defaultBranchId: searchParams.get("branch") ?? undefined,
    selectedAppointmentId: searchParams.get("appointment") ?? undefined,
    selectedSaleId: searchParams.get("sale") ?? undefined,
    selectedCustomerId: customerMatch?.[1] ? decodeURIComponent(customerMatch[1]) : undefined,
  };
}
