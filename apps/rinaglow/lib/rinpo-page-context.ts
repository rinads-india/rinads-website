export type RinpoPageContext = {
  defaultBranchId?: string;
  selectedAppointmentId?: string;
  selectedSaleId?: string;
  selectedCustomerId?: string;
};

export function getRinpoPageContext(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">
): RinpoPageContext {
  const customerMatch = pathname.match(/^\/clients\/([^/]+)$/);
  return {
    defaultBranchId: searchParams.get("branch") ?? undefined,
    selectedAppointmentId: searchParams.get("appointment") ?? undefined,
    selectedSaleId: searchParams.get("sale") ?? undefined,
    selectedCustomerId: customerMatch?.[1] ? decodeURIComponent(customerMatch[1]) : undefined,
  };
}
