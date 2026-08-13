# Target Database Architecture (Design Only)

**Date:** 2026-08-13  
**Constraint:** No migrations created. No production Supabase connected.

---

## Principles

1. PostgreSQL is the system of record (not AI).
2. RLS is mandatory on all tenant-sensitive tables.
3. Prefer additive, backwards-compatible migrations.
4. Multi-tenant by `organization_id` (default pattern).
5. Narrow privileges: anon/authenticated via RLS; service role server-only.

---

## Environment strategy (preview)

| Environment | Supabase project | Notes |
|-------------|------------------|-------|
| development | `rinads-dev` | Local + hosted dev |
| staging | `rinads-staging` | Prod-like data scrubbed |
| production | `rinads-prod` | Founder-controlled |

Never share prod DB with marketing preview deploys using service role.

---

## Domain map

```
identity          → auth.users + profiles
organizations     → tenant root
memberships       → user ↔ org
roles             → org-scoped or global role definitions
permissions       → permission catalog + role_permissions
subscriptions     → plan attachment per org
billing           → invoices/payments (later; external PSP)
audit_logs        → append-only security/product audit
files             → metadata; bytes in Storage
notifications     → in-app + delivery tracking
activities        → product activity feed
feature_flags     → flag defs + org/user overrides
ai_context        → scoped context refs (not business truth)
ai_tools          → tool registry + invocation audit
rinpo_config      → per-org/user RINPO preferences
```

Vertical domains (CRM, ERP, RINAGLOW) **depend on** the above and must not redefine users/orgs.

---

## Proposed core tables (logical)

### identity / profiles

- `profiles`  
  - `id` UUID PK = `auth.users.id`  
  - `display_name`, `avatar_url`, `locale`, `created_at`, `updated_at`

### organizations

- `organizations`  
  - `id`, `name`, `slug`, `status`, `created_at`
- `organization_members`  
  - `id`, `organization_id`, `user_id`, `role_id` or `role_key`, `status`, `created_at`  
  - UNIQUE `(organization_id, user_id)`

### roles / permissions

- `roles` — `id`, `key`, `name`, `scope` (`system` | `organization`)
- `permissions` — `id`, `key` (e.g. `crm.contact.read`), `description`
- `role_permissions` — `role_id`, `permission_id`
- Optional: `member_permission_overrides`

**Bootstrap system roles (suggested):** `founder`, `super_admin`, `admin`, `manager`, `staff`, `client`, `viewer`  
Public signup must **never** self-assign `founder` / `super_admin`.

### feature_flags

- `feature_flags` — `key`, `description`, `default_enabled`
- `feature_flag_overrides` — `flag_key`, `organization_id` nullable, `user_id` nullable, `enabled`

### subscriptions / billing (phase later)

- `plans`, `organization_subscriptions`, `billing_customers`  
Keep payment provider IDs; do not invent ledger until needed.

### audit_logs

- `audit_logs`  
  - `id`, `organization_id`, `actor_type` (`user` | `ai` | `system`), `actor_id`  
  - `approved_by`, `action`, `entity`, `entity_id`  
  - `before`, `after` (JSONB), `source`, `ip`, `user_agent`, `created_at`  
- Insert-only for authenticated paths; no update/delete from clients.

### files

- `files`  
  - `id`, `organization_id`, `owner_user_id`, `bucket`, `path`, `mime`, `size`, `visibility`  
- Storage paths: `organizations/{org_id}/...` — never world-public by default.

### notifications / activities

- `notifications` — user-targeted, org-scoped
- `activities` — org timeline events

### AI / RINPO

- `ai_tool_definitions` — name, description, permission_key, danger_level (`read` | `write` | `destructive`)
- `ai_tool_invocations` — tool, args hash, result status, actor, approval_id
- `ai_approvals` — requested action, status, approver
- `rinpo_preferences` — voice, language, persona intensity (non-destructive)
- `ai_context_links` — pointers to entities for retrieval (not duplicated truth)

---

## RLS pattern (recommended)

For each tenant table `T` with `organization_id`:

1. ENABLE RLS.
2. SELECT/INSERT/UPDATE/DELETE policies require membership in that organization.
3. Further restrict by permission keys for sensitive tables.
4. `audit_logs`: INSERT for members (or service role only); SELECT for admins.
5. Never `USING (true)` on tenant data.

Helper SQL ideas (not implemented):

- `auth.uid()`
- `is_org_member(org_id)`
- `has_permission(org_id, permission_key)`

---

## Storage buckets (recommended)

| Bucket | Access |
|--------|--------|
| `public-brand` | Public read (logos, marketing) |
| `org-files` | Authenticated + RLS path isolation |
| `rinpo-assets` | Public read for approved UI assets; write admin-only |

---

## Edge Functions (later)

- Privileged billing webhooks
- Invite acceptance
- AI tool execution proxy (permission-checked)
- n8n webhook receivers with signature verification

---

## Migration discipline (when authorized)

1. Inspect existing schema
2. Additive migration
3. RLS + indexes in same change set when practical
4. Document rollback
5. Never rewrite applied production migrations

---

## Explicitly out of scope for first schema

- Full ERP ledgers
- RINAGLOW domain tables
- Vector DB as source of truth
- Arbitrary SQL execution for AI
