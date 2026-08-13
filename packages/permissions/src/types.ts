/**
 * Foundational RBAC types only (Phase 0).
 *
 * CLIENT UI CHECKS ARE NOT AUTHORIZATION.
 * Real authorization will be enforced with Supabase RLS + server checks in Phase 1+.
 * Do not treat role labels in the browser as security.
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

/** Dot-namespaced permission keys, e.g. "crm.contact.read" — catalog expands in Phase 1+. */
export type PermissionKey = string;

export type Permission = {
  key: PermissionKey;
  description: string;
};

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: string };
