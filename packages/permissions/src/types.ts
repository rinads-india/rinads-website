/**
 * Foundational RBAC types.
 *
 * CLIENT UI CHECKS ARE NOT AUTHORIZATION.
 * Real authorization is enforced with Supabase RLS + server checks.
 */

export type RoleKey =
  | "founder"
  | "super_admin"
  | "admin"
  | "manager"
  | "staff"
  | "client"
  | "viewer";

export type Role = {
  key: RoleKey;
  name: string;
  scope: "system" | "organization";
};

/** Dot-namespaced permission keys aligned with CORE seed. */
export type PermissionKey =
  | "org.read"
  | "org.manage"
  | "org.members.manage"
  | "audit.read"
  | "flags.read"
  | (string & {});

export type Permission = {
  key: PermissionKey;
  description: string;
};

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

export const PRIVILEGED_ROLE_KEYS: readonly RoleKey[] = [
  "founder",
  "super_admin",
] as const;

export const CORE_PERMISSION_KEYS = [
  "org.read",
  "org.manage",
  "org.members.manage",
  "audit.read",
  "flags.read",
] as const satisfies readonly PermissionKey[];

export function isPrivilegedRoleKey(key: string): boolean {
  return (PRIVILEGED_ROLE_KEYS as readonly string[]).includes(key);
}

/**
 * Pure helper for composing AccessDecision objects.
 * Does NOT grant access by itself — use with RLS-backed data only.
 */
export function decideAccess(allowed: boolean, reason: string): AccessDecision {
  return allowed ? { allowed: true } : { allowed: false, reason };
}
