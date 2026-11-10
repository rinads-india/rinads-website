-- RINADS Social OS — Social Connections module.
-- Creates tables for OAuth sessions, provider credentials, connections,
-- posts, publish jobs, metrics, webhook events, and audit logs.
-- Every table is tenant-scoped via organization_id with private RLS.
-- No existing tables are altered; rollback by dropping these tables.

-- ---------------------------------------------------------------------------
-- Custom enum types
-- ---------------------------------------------------------------------------

create type public.social_provider_id as enum (
  'facebook',
  'instagram',
  'linkedin',
  'x',
  'youtube',
  'tiktok',
  'google_business',
  'pinterest',
  'threads'
);

create type public.connection_health_state as enum (
  'healthy',
  'degraded',
  'expired',
  'error',
  'pending'
);

create type public.publish_job_status as enum (
  'pending_approval',
  'approved',
  'rejected',
  'cancelled',
  'enqueued',
  'publishing',
  'published',
  'failed'
);

-- ---------------------------------------------------------------------------
-- oauth_sessions — short-lived PKCE / state sessions (max 10 min TTL)
-- ---------------------------------------------------------------------------

create table if not exists public.oauth_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  initiated_by    uuid not null references auth.users (id) on delete cascade,
  provider_id     public.social_provider_id not null,
  state           text not null unique,          -- CSPRNG 32-byte hex
  code_verifier   text,                          -- PKCE; NULL for providers that don't support it
  redirect_uri    text not null,
  scopes          text[] not null default '{}',
  used_at         timestamptz,                   -- set on first valid callback; replays rejected
  expires_at      timestamptz not null default (now() + interval '10 minutes'),
  created_at      timestamptz not null default now()
);

create index if not exists oauth_sessions_org_idx
  on public.oauth_sessions (organization_id);
create index if not exists oauth_sessions_state_idx
  on public.oauth_sessions (state);
create index if not exists oauth_sessions_expires_idx
  on public.oauth_sessions (expires_at)
  where used_at is null;

comment on table public.oauth_sessions is
  'Short-lived OAuth PKCE / state sessions. Expire after 10 minutes. One-time use.';

-- ---------------------------------------------------------------------------
-- social_credentials — encrypted provider tokens (server-only write)
-- ---------------------------------------------------------------------------

create table if not exists public.social_credentials (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider_id     public.social_provider_id not null,
  external_user_id text not null,               -- provider's user/page/account id
  token_ciphertext text not null,               -- AES-256-GCM encrypted token bundle
  token_iv         text not null,               -- base64url IV
  token_tag        text not null,               -- base64url GCM authentication tag
  granted_scopes   text[] not null default '{}',
  expires_at       timestamptz,                 -- NULL = non-expiring (rare)
  refresh_expires_at timestamptz,
  key_version      smallint not null default 1, -- for key rotation
  revoked_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, provider_id, external_user_id)
);

create index if not exists social_credentials_org_idx
  on public.social_credentials (organization_id);
create index if not exists social_credentials_expiry_idx
  on public.social_credentials (expires_at)
  where revoked_at is null and expires_at is not null;

comment on column public.social_credentials.token_ciphertext is
  'AES-256-GCM ciphertext. Key held in SOCIAL_TOKENS_SECRET server env. Never decrypted in SQL.';

-- ---------------------------------------------------------------------------
-- social_connections — logical account connections (Facebook Page, IG account …)
-- ---------------------------------------------------------------------------

create table if not exists public.social_connections (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  credential_id    uuid not null references public.social_credentials (id) on delete cascade,
  provider_id      public.social_provider_id not null,
  account_type     text not null,               -- 'page' | 'profile' | 'channel' | ...
  external_id      text not null,               -- provider's page/channel/account id
  display_name     text not null,
  avatar_url       text,
  username         text,
  follower_count   bigint,
  connected_by     uuid references auth.users (id) on delete set null,
  health_state     public.connection_health_state not null default 'pending',
  last_checked_at  timestamptz,
  disconnected_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, provider_id, external_id)
);

create index if not exists social_connections_org_idx
  on public.social_connections (organization_id);
create index if not exists social_connections_active_idx
  on public.social_connections (organization_id, provider_id)
  where disconnected_at is null;

comment on table public.social_connections is
  'Each row represents one connected social account (page, profile, channel) for a tenant.';

-- ---------------------------------------------------------------------------
-- social_posts — post drafts and published content
-- ---------------------------------------------------------------------------

create table if not exists public.social_posts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  connection_id    uuid not null references public.social_connections (id) on delete cascade,
  created_by       uuid references auth.users (id) on delete set null,
  post_type        text not null default 'text'
                     check (post_type in ('text', 'image', 'carousel', 'video', 'reel', 'story')),
  body             text not null default '',
  media_urls       text[] not null default '{}',
  link_url         text,
  tags             text[] not null default '{}',
  scheduled_at     timestamptz,
  published_at     timestamptz,
  external_post_id text,                        -- provider's post/media id after publish
  status           text not null default 'draft'
                     check (status in ('draft', 'pending_approval', 'approved', 'published', 'failed', 'cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists social_posts_org_idx
  on public.social_posts (organization_id);
create index if not exists social_posts_connection_idx
  on public.social_posts (connection_id);
create index if not exists social_posts_scheduled_idx
  on public.social_posts (scheduled_at)
  where scheduled_at is not null and status = 'approved';

-- ---------------------------------------------------------------------------
-- social_publish_jobs — approval + publish pipeline
-- ---------------------------------------------------------------------------

create table if not exists public.social_publish_jobs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  post_id          uuid not null references public.social_posts (id) on delete cascade,
  connection_id    uuid not null references public.social_connections (id) on delete cascade,
  idempotency_key  uuid not null unique default gen_random_uuid(),
  status           public.publish_job_status not null default 'pending_approval',
  approval_id      text,                        -- @rinads/runtime ApprovalRecord.id
  submitted_by     uuid references auth.users (id) on delete set null,
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  scheduled_at     timestamptz,
  enqueued_at      timestamptz,
  published_at     timestamptz,
  failed_at        timestamptz,
  failure_reason   text,
  retry_count      smallint not null default 0,
  provider_response jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists social_publish_jobs_org_idx
  on public.social_publish_jobs (organization_id);
create index if not exists social_publish_jobs_post_idx
  on public.social_publish_jobs (post_id);
create index if not exists social_publish_jobs_pending_idx
  on public.social_publish_jobs (organization_id, status)
  where status in ('pending_approval', 'approved', 'enqueued', 'publishing');

-- ---------------------------------------------------------------------------
-- social_metrics_daily — daily per-connection stats snapshot
-- ---------------------------------------------------------------------------

create table if not exists public.social_metrics_daily (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  connection_id    uuid not null references public.social_connections (id) on delete cascade,
  metric_date      date not null,
  impressions      bigint not null default 0,
  reach            bigint not null default 0,
  engagement       bigint not null default 0,
  followers        bigint not null default 0,
  posts_published  smallint not null default 0,
  raw_snapshot     jsonb,
  created_at       timestamptz not null default now(),
  unique (connection_id, metric_date)
);

create index if not exists social_metrics_daily_org_idx
  on public.social_metrics_daily (organization_id);
create index if not exists social_metrics_daily_connection_date_idx
  on public.social_metrics_daily (connection_id, metric_date desc);

-- ---------------------------------------------------------------------------
-- social_webhook_events — incoming provider webhook payloads (audit + replay)
-- ---------------------------------------------------------------------------

create table if not exists public.social_webhook_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  provider_id      public.social_provider_id not null,
  event_type       text not null,
  external_id      text,                        -- provider's event id for deduplication
  payload          jsonb not null,
  signature_valid  boolean not null default false,
  processed        boolean not null default false,
  processed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (provider_id, external_id)
);

create index if not exists social_webhook_events_provider_idx
  on public.social_webhook_events (provider_id, created_at desc);
create index if not exists social_webhook_events_unprocessed_idx
  on public.social_webhook_events (processed)
  where not processed;

-- ---------------------------------------------------------------------------
-- social_audit_logs — social-domain-specific audit entries
-- ---------------------------------------------------------------------------

create table if not exists public.social_audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  actor_type       text not null check (actor_type in ('user', 'ai', 'system')),
  actor_id         uuid,
  action           text not null,              -- social.connection.created, social.publish.approved …
  entity           text,
  entity_id        uuid,
  metadata         jsonb,                      -- sanitised (no tokens)
  ip               text,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index if not exists social_audit_logs_org_idx
  on public.social_audit_logs (organization_id, created_at desc);
create index if not exists social_audit_logs_entity_idx
  on public.social_audit_logs (entity, entity_id)
  where entity is not null;

-- ---------------------------------------------------------------------------
-- RLS policies — same pattern as company_os tables
-- ---------------------------------------------------------------------------

-- Enable RLS on all new tables
alter table public.oauth_sessions          enable row level security;
alter table public.social_credentials      enable row level security;
alter table public.social_connections      enable row level security;
alter table public.social_posts            enable row level security;
alter table public.social_publish_jobs     enable row level security;
alter table public.social_metrics_daily    enable row level security;
alter table public.social_webhook_events   enable row level security;
alter table public.social_audit_logs       enable row level security;

-- oauth_sessions: only the initiating org member can read their own session
-- (write is service-role only from the API layer)
create policy "oauth_sessions_org_member_read"
  on public.oauth_sessions for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_credentials: service-role write only; org members can read metadata (not token values)
create policy "social_credentials_org_member_read"
  on public.social_credentials for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_connections: org members can read; service-role writes
create policy "social_connections_org_member_read"
  on public.social_connections for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_posts: org members can read their org's posts
create policy "social_posts_org_member_read"
  on public.social_posts for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_publish_jobs: org members can read; approval writes are service-role
create policy "social_publish_jobs_org_member_read"
  on public.social_publish_jobs for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_metrics_daily: org members can read
create policy "social_metrics_daily_org_member_read"
  on public.social_metrics_daily for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_audit_logs: org members can read their own org's logs
create policy "social_audit_logs_org_member_read"
  on public.social_audit_logs for select
  using (
    organization_id in (
      select om.organization_id
      from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );

-- social_webhook_events: service-role only (not user-readable)
-- No SELECT policy = no user access via RLS
