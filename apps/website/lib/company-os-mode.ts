import { isCompanyOsOrg } from "@rinads/company-os";
import type { RoleKey } from "@rinads/permissions";

/**
 * Resolve Company OS shell mode for the active /os session.
 * Live: organizations.is_platform_operator (or feature flag).
 * Demo/unenforced: NEXT_PUBLIC_COMPANY_OS=true or founder role.
 */
export function resolveCompanyOsMode(input: {
  enforced: boolean;
  isPlatformOperator?: boolean | null;
  featureCompanyOs?: boolean | null;
  roleKey?: RoleKey | null;
}): boolean {
  const envForced =
    process.env.NEXT_PUBLIC_COMPANY_OS === "true" ||
    process.env.NEXT_PUBLIC_COMPANY_OS === "1";

  if (!input.enforced) {
    return isCompanyOsOrg({
      demoForced: envForced || input.roleKey === "founder" || input.roleKey === "super_admin",
      featureCompanyOs: input.featureCompanyOs,
      isPlatformOperator: input.isPlatformOperator,
    });
  }

  return isCompanyOsOrg({
    isPlatformOperator: input.isPlatformOperator,
    featureCompanyOs: input.featureCompanyOs || envForced,
  });
}

export function canAccessFounderTower(roleKey: RoleKey | null | undefined): boolean {
  return roleKey === "founder" || roleKey === "super_admin" || roleKey === "admin";
}
