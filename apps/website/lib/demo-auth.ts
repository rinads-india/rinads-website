import type { LoginRole } from "@/components/rinpo/LoginModal";

/** Public demo roles only — founder/super-admin self-registration is forbidden. */
export const DEMO_ALLOWED_ROLES = ["client", "staff", "admin"] as const;

export type DemoAllowedRole = (typeof DEMO_ALLOWED_ROLES)[number];

export function isDemoAllowedRole(role: unknown): role is DemoAllowedRole {
  return (
    typeof role === "string" &&
    (DEMO_ALLOWED_ROLES as readonly string[]).includes(role)
  );
}

export function assertDemoRole(role: LoginRole): DemoAllowedRole | null {
  return isDemoAllowedRole(role) ? role : null;
}
