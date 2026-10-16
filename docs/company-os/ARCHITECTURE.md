# Company OS — locked architecture, route map and migration plan

Companion to [IMPLEMENTATION-MATRIX.md](./IMPLEMENTATION-MATRIX.md). Tracking issue #127.

## 1. Layering (unchanged canon)

```text
RINPO (interface)  ── /os shell + dock + POST /api/os/rinpo
      │
RINADS Intelligence ── @rinads/intelligence  (selectRinpoModel routing; providers are replaceable workers)
      │                 @rinads/company-os   (deterministic briefing / attention / recommendations)
      │
RINPO Runtime (governed actions) ── Request → Context → Permission → Risk → Approval → Domain tool
      │                              → Execution → Postcondition verify → Audit/Event → Result
      │                              (@rinads/company-os `governed` pipeline, injected ports;
      │                               ledger = existing `rinpo_actions`; audit = `audit_logs`; events = `business_events`)
      │
Business Graph / domain services ── Supabase tables (RLS) read/written only through the user's session
      │
RINADS Cloud ── tenancy (organizations, organization_members, roles, permissions), Postgres, Storage, Edge
```

Invariants

1. **Model output is never authorization.** Agents are configuration (`AgentRoleProfile`); an `agent` actor can *propose* and *request approval* but `evaluateAction` returns `DENY`/`APPROVAL_REQUIRED` for any state-changing action above `LOW` and never `ALLOW` for `HIGH`/`CRITICAL`.
2. **No AI → production DB path.** Every write goes through a registered, typed domain tool executed with the *caller's* RLS session. There is no service-role client in any `/os` write path. (The only service-role use is the env-gated, read-only `site_leads` import and engineering adapters, both server-only and fail-closed.)
3. **Requester ≠ approver** for `HIGH`/`CRITICAL`; approval is bound to a payload hash and expires.
4. **Idempotent retries.** Each action carries an idempotency key; `rinpo_actions(organization_id, idempotency_key)` is unique.
5. **Postcondition verification.** A handler's success is not trusted: the tool's `verify` re-reads the row (RLS) and must confirm expected state or the action is recorded `failed` (`verification_error`).
6. **No fabricated data.** Every snapshot section is `available | unavailable | not_connected` with a reason; unavailable sections yield no metric, no score, no urgency.

## 2. Packages

| Package | Role | IO |
|---------|------|----|
| `@rinads/company-os` (new) | Pure domain: module registry, permissions, lifecycle state machines, pipeline math, finance/receivables, work-allocation scoring, attention aggregation, founder snapshot + briefing, studio/asset provenance rules, growth/ads signal engine, agent role profiles, governed-action policy + pipeline, canonical events | none (ports injected) |
| `apps/website/lib/company-os/*` | Supabase loaders (RLS session) producing `CompanyFacts`; server actions; engineering adapters; RINPO endpoint | Supabase, fetch |

`@rinads/company-os` depends only on `@rinads/permissions` (types) so it stays unit-testable with `node --test`.

## 3. Route map (`/os`, one shell, role-aware)

| Area | Route | Min. permission | Notes |
|------|-------|-----------------|-------|
| Home | `/os` | any member | existing command centre, extended |
| Founder | `/os/founder` | `company.founder.view` | Control Tower |
| Customers | `/os/customers`, `/os/customers/[companyId]` | `crm.read` | client workspace aggregate |
| Sales | `/os/sales` | `crm.read` | pipeline, proposals, contracts |
| Work | `/os/work` (+ `/tasks`, `/projects`, `/teams`, `/calendar` existing) | `projects.read` / member | in-shell board, allocation |
| Studio | `/os/studio` | `studio.read` | pipeline jobs |
| Growth | `/os/growth` | `growth.read` | campaigns, content variants |
| Ads | `/os/ads` | `growth.read` | signals, `not_connected` states |
| Engineering | `/os/engineering` | `engineering.read` | GitHub / Vercel / Supabase |
| AI | `/os/ai` | `ai.read` | providers, runs, cost, roles |
| Commerce | `/os/commerce` (+ legacy `/os/money`) | `commerce.order.read` | summary + deep links |
| Finance | `/os/finance` | `finance.read` | invoices, receivables, cash |
| People | `/os/people` | `people.read` | skills, capacity |
| Logistics | `/os/logistics` | `commerce.order.read` | order→shipment→exception |
| Communication | `/os/communication` | `comms.read` | activity + exceptions |
| Academy | `/os/academy` | member | skill→certification |
| Platforms | `/os/platforms` | `org.read` | verticals |
| Assets | `/os/assets` | `studio.read` | provenance library |
| Approvals | `/os/approvals` | member (decide: `approvals.decide`) | unified ledger |
| Reports | `/os/reports` | `reports.read` | computed reports |
| Settings | `/os/settings` | `org.manage` | existing + policies |

Legacy `/os/money`, `/os/automate`, `/os/rooms` keep working unchanged.

## 4. Additive migrations (all `20261016…`, none applied automatically)

| File | Content |
|------|---------|
| `…120000_company_os_permissions.sql` | new permission keys + role mappings (additive `ON CONFLICT DO NOTHING`) |
| `…120100_company_os_crm_sales.sql` | `crm_companies`, `crm_contacts`, `crm_leads`, `crm_opportunities`, `crm_proposals`, `crm_contracts` |
| `…120200_company_os_delivery_finance.sql` | `projects`, `project_milestones`, `deliverables`, `finance_invoices`, `finance_payments`; additive columns on `operational_tasks` |
| `…120300_company_os_people_work.sql` | `people_profiles`, `work_assignment_decisions` |
| `…120400_company_os_studio_growth.sql` | `studio_jobs`, `creative_assets`, `asset_publications`, `asset_performance`, `growth_campaigns`, `content_items`, `ad_campaigns`, `ad_metrics_daily` |
| `…120500_company_os_comms_academy_ai.sql` | `comm_activities`, `academy_skills`, `academy_progress`, `ai_runs`, `ai_agent_profiles` |
| `…120600_company_os_ledger_events.sql` | additive columns on `rinpo_actions` (+ unique idempotency index), narrow `business_events` member-insert policy |

Rules enforced by `apps/website/tests/company-os-migrations.test.ts`: every new table has `ENABLE ROW LEVEL SECURITY` and ≥1 policy; every policy is org-scoped via `private.is_org_member`/`private.has_permission`; no `SECURITY DEFINER`; no grant to `anon`; every statement is additive (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`); no `DROP`, no `TRUNCATE`, no data-destructive `DELETE`/`UPDATE` without `WHERE`.

## 5. Lifecycle (one connected graph)

```text
crm_leads ─► crm_companies + crm_contacts ─► crm_opportunities ─► crm_proposals ─► crm_contracts
                                                                                │ (signed ⇒ client)
                                                                                ▼
                                              projects(kind=project|retainer) ─► project_milestones
                                                       │                               │
                                              operational_tasks (project_id, milestone_id, required_skills, estimate_hours)
                                                       │
                                                  deliverables ─► approval (governed action `deliverable.approve`)
                                                       │
                                  finance_invoices ─► finance_payments ─► performance (campaign/asset metrics) ─► renewal/upsell opportunity
```

Every table carries `organization_id`; cross-links are same-org (enforced by composite RLS `WITH CHECK` using the row's own `organization_id` and FK existence checks in the tool's postcondition).

## 6. Event vocabulary

`lead.created`, `lead.qualified`, `opportunity.stage_changed`, `proposal.sent`, `contract.signed`, `project.created`, `milestone.delayed`, `task.completed`, `creative.submitted`, `creative.approved`, `content.published`, `invoice.issued`, `invoice.overdue`, `payment.received`, `deployment.failed`, `shipment.delayed`, `approval.requested`, `approval.completed`, `ai.action.executed`, `ai.action.failed` (all `…v1`, tenant + correlation carried). Normal activity is aggregated; only exceptions reach the founder Attention queue.
