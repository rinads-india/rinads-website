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

export type Plan = {
  key: string;
  name: string;
  description: string;
  limits: Json;
  is_active: boolean;
  created_at: string;
};

export type OrganizationSubscription = {
  id: string;
  organization_id: string;
  plan_key: string;
  status: "active" | "trialing" | "past_due" | "cancelled";
  started_at: string;
  ends_at: string | null;
};

export type OrganizationSettings = {
  organization_id: string;
  timezone: string;
  currency: string;
  vertical_key: string;
  storefront_slug: string | null;
  settings: Json;
  updated_at: string;
};

export type TenantProvisioningJob = {
  id: string;
  organization_id: string;
  template_key: string;
  status: "pending" | "running" | "completed" | "failed";
  idempotency_key: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type Service = {
  id: string;
  organization_id: string | null;
  pod_id: string | null;
  slug: string;
  name: string;
  description: string;
  pillar: "build" | "grow" | "automate" | "transform";
  pricing_model: string;
  base_price: number | null;
  currency: string;
  estimated_delivery_days: number | null;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type ServiceOrder = {
  id: string;
  organization_id: string;
  service_id: string;
  order_number: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  scope: Json;
  requirements: Json;
  due_date: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Minimal Database typing for CORE + platform tables (expand via supabase gen types). */
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
      plans: {
        Row: Plan;
        Insert: Partial<Plan> & { key: string; name: string };
        Update: Partial<Plan>;
        Relationships: [];
      };
      organization_subscriptions: {
        Row: OrganizationSubscription;
        Insert: Partial<OrganizationSubscription> & { organization_id: string; plan_key: string };
        Update: Partial<OrganizationSubscription>;
        Relationships: [];
      };
      organization_settings: {
        Row: OrganizationSettings;
        Insert: Partial<OrganizationSettings> & { organization_id: string };
        Update: Partial<OrganizationSettings>;
        Relationships: [];
      };
      tenant_provisioning_jobs: {
        Row: TenantProvisioningJob;
        Insert: Partial<TenantProvisioningJob> & { organization_id: string; template_key: string };
        Update: Partial<TenantProvisioningJob>;
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: Partial<Service> & { slug: string; name: string; pillar: Service["pillar"] };
        Update: Partial<Service>;
        Relationships: [];
      };
      service_orders: {
        Row: ServiceOrder;
        Insert: Partial<ServiceOrder> & {
          organization_id: string;
          service_id: string;
          amount: number;
        };
        Update: Partial<ServiceOrder>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string };
        Returns: Organization;
      };
      provision_tenant: {
        Args: { p_name: string; p_slug: string; p_template_key?: string; p_plan_key?: string };
        Returns: Organization;
      };
      set_organization_status: {
        Args: { p_org_id: string; p_status: string };
        Returns: Organization;
      };
      get_public_service_order_status: {
        Args: { p_order_id: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function isDatabaseConfigured(config: Partial<DatabaseConfig>): config is DatabaseConfig {
  return Boolean(config.url && config.anonKey);
}
