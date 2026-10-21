export * from "./types";
export * from "./events";
export * from "./permissions";
export * from "./assignment";
export * from "./approvals";
export * from "./health";
export * from "./finance-core";
export * from "./india-compliance";
export * from "./demo-store";

/** Resolve whether an organization should render Company OS shell. */
export function isCompanyOsOrg(flags: {
  isPlatformOperator?: boolean | null;
  featureCompanyOs?: boolean | null;
  demoForced?: boolean | null;
}): boolean {
  if (flags.demoForced) return true;
  if (flags.featureCompanyOs) return true;
  return Boolean(flags.isPlatformOperator);
}
