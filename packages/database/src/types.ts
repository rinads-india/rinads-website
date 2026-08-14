export type DatabaseConfig = {
  url: string;
  anonKey: string;
  /** Server-only. Never ship to the browser. */
  serviceRoleKey?: string;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  status: "active" | "invited" | "removed";
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string | null;
  actor_type: "user" | "ai" | "system";
  actor_id: string | null;
  approved_by: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  before: Json | null;
  after: Json | null;
  source: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

/** Minimal Database typing for CORE tables (expand in later phases). */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile>; Relationships: [] };
      organizations: {
        Row: Organization;
        Insert: Pick<Organization, "name" | "slug"> & Partial<Organization>;
        Update: Partial<Organization>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Omit<OrganizationMember, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<OrganizationMember>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      feature_flags: {
        Row: { key: string; description: string; default_enabled: boolean; created_at: string };
        Insert: { key: string; description?: string; default_enabled?: boolean };
        Update: Partial<{ description: string; default_enabled: boolean }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string };
        Returns: Organization;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function isDatabaseConfigured(config: Partial<DatabaseConfig>): config is DatabaseConfig {
  return Boolean(config.url && config.anonKey);
}
