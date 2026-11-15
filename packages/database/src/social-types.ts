/**
 * Social OS tables introduced by 20261110130000_social_connections.sql.
 * The core Database typing imports these until Supabase generated types are adopted.
 * These are static types only; no database or RLS configuration is modified.
 */
import type { Json } from "./types";

type SocialProvider = "facebook" | "instagram" | "linkedin" | "x" | "youtube" | "tiktok" | "google_business" | "pinterest" | "threads";
type Health = "healthy" | "degraded" | "expired" | "error" | "pending";
type PublishStatus = "pending_approval" | "approved" | "rejected" | "cancelled" | "enqueued" | "publishing" | "published" | "failed";
type Table<Row extends object> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type SocialTables = {
  oauth_sessions: Table<{
    id: string; organization_id: string; initiated_by: string; provider_id: SocialProvider;
    state: string; code_verifier: string | null; redirect_uri: string; scopes: string[];
    used_at: string | null; expires_at: string; created_at: string;
  }>;
  social_credentials: Table<{
    id: string; organization_id: string; provider_id: SocialProvider; external_user_id: string;
    token_ciphertext: string; token_iv: string; token_tag: string; granted_scopes: string[];
    expires_at: string | null; refresh_expires_at: string | null; key_version: number;
    revoked_at: string | null; created_at: string; updated_at: string;
  }>;
  social_connections: Table<{
    id: string; organization_id: string; credential_id: string; provider_id: SocialProvider;
    account_type: string; external_id: string; display_name: string; avatar_url: string | null;
    username: string | null; follower_count: number | null; connected_by: string | null;
    health_state: Health; last_checked_at: string | null; disconnected_at: string | null;
    created_at: string; updated_at: string;
  }>;
  social_posts: Table<{
    id: string; organization_id: string; connection_id: string; created_by: string | null;
    post_type: "text" | "image" | "carousel" | "video" | "reel" | "story";
    body: string; media_urls: string[]; link_url: string | null; tags: string[];
    scheduled_at: string | null; published_at: string | null; external_post_id: string | null;
    status: "draft" | "pending_approval" | "approved" | "published" | "failed" | "cancelled";
    created_at: string; updated_at: string;
  }>;
  social_publish_jobs: Table<{
    id: string; organization_id: string; post_id: string; connection_id: string;
    idempotency_key: string; status: PublishStatus; approval_id: string | null;
    submitted_by: string | null; reviewed_by: string | null; reviewed_at: string | null;
    scheduled_at: string | null; enqueued_at: string | null; published_at: string | null;
    failed_at: string | null; failure_reason: string | null; retry_count: number;
    provider_response: Json | null; created_at: string; updated_at: string;
  }>;
  social_metrics_daily: Table<{
    id: string; organization_id: string; connection_id: string; metric_date: string;
    impressions: number; reach: number; engagement: number; followers: number;
    posts_published: number; raw_snapshot: Json | null; created_at: string;
  }>;
  social_webhook_events: Table<{
    id: string; organization_id: string | null; provider_id: SocialProvider;
    event_type: string; external_id: string | null; payload: Json; signature_valid: boolean;
    processed: boolean; processed_at: string | null; created_at: string;
  }>;
  social_audit_logs: Table<{
    id: string; organization_id: string; actor_type: "user" | "ai" | "system";
    actor_id: string | null; action: string; entity: string | null; entity_id: string | null;
    metadata: Json | null; ip: string | null; user_agent: string | null; created_at: string;
  }>;
};
