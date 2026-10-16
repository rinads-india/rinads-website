# Company OS — locked architecture, route map and migration plan

Companion to [IMPLEMENTATION-MATRIX.md](./IMPLEMENTATION-MATRIX.md). Tracking issue #127.

## 1. Layering (unchanged canon)

```text
RINPO (interface)  ── /os shell + dock + POST /api/os/rinpo
      │
RINADS Intelligence ── @rinads/intelligence  (selectRinpoModel routing; providers are replaceable workers)
      │                 @rinads/company-os-engine   (deterministic briefing / attention / recommendations)
      │
RINPO Runtime (governed actions) ── Request → Context → Permission → Risk → Approval → Domain tool
      │                              → Execution → Postcondition verify → Audit/Event → Result
      │                              (@rinads/company-os-engine `governed` pipeline, injected ports;
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
| `@rinads/company-os-engine` (new) | Pure domain: module registry, permissions, lifecycle state machines, pipeline math, finance/receivables, work-allocation scoring, attention aggregation, founder snapshot + briefing, studio/asset provenance rules, growth/ads signal engine, agent role profiles, governed-action policy + pipeline, canonical events | none (ports injected) |
| `apps/website/lib/company-os/*` | Supabase loaders (RLS session) producing `CompanyFacts`; server actions; engineering adapters; RINPO endpoint | Supabase, fetch |

`@rinads/company-os-engine` depends only on `@rinads/permissions` (types) so it stays unit-testable with `node --test`.

## 3. Route map (`/os`, one shell, role-aware)

| Area | Route | Min. permission | Notes |
|------|-------|-----------------|-------|
| Home | `/os` | any member | existing command centre, extended |
| Founder | `/os/founder` | `company.founder.view` | Control Tower |
| Customers | `/os/customers`, `/os/customers/[companyId]` | member (workspace data: `crm.read`) | client workspace aggregate; legacy bridge stays for everyone |
| Sales | `/os/sales` | `crm.read` | pipeline, proposals, contracts |
| Work | `/os/work` (+ `/tasks`, `/projects`, `/teams`, `/calendar` existing) | `projects.read` / member | in-shell board, allocation |
| Studio | `/os/studio` | `studio.read` | pipeline jobs |
| Growth | `/os/growth` | member (workspace data: `growth.read`) | campaigns, content variants; legacy bridge stays |
| Ads | `/os/ads` | `growth.read` | signals, `not_connected` states |
| Engineering | `/os/engineering` | `engineering.read` | GitHub / Vercel / Supabase |
| AI | `/os/ai` | `ai.read` | providers, runs, cost, roles |
| Commerce | `/os/commerce` (+ legacy `/os/money`) | nav: `commerce.order.read`; page: member (orders need `commerce.order.read`) | read of existing orders + bridge to portals |
| Finance | `/os/finance` | `finance.read` | invoices, receivables, cash |
| People | `/os/people` | `people.read` | skills, capacity |
| Logistics | `/os/logistics` | `commerce.order.read` | order→shipment→exception |
| Communication | `/os/communication` | nav: `comms.read`; page: member (activity log needs `comms.read`, rooms for all) | activity linked to records + existing Rooms |
| Academy | `/os/academy` | `academy.read` | skill→certification (advisory) |
| Platforms | `/os/platforms` | nav: `org.read`; page: bridge filtered by existing tier rules | connected products + runtime boundary |
| Assets | `/os/assets` | `studio.read` | provenance library |
| Approvals | `/os/approvals` | `approvals.read` (decide: `approvals.decide`) | unified ledger + history |
| Reports | `/os/reports` | `reports.read` | computed reports |
| Settings | `/os/settings` | nav: `org.manage`; page: member (policy, integrations, catalogue shown only to org admins) | existing bridge + read-only policy/catalogue |

Legacy `/os/money`, `/os/automate`, `/os/rooms` keep working unchanged.

Navigation visibility (`packages/company-os-engine/src/modules.ts`) is only a convenience. Every page re-checks on the server with `guard()` and every query runs on the caller's RLS session, so a hidden link and a forbidden URL behave the same. Detail rows for area pages are read by `packages/company-os-server/src/details.ts`, permission-gated and returning explicit unavailable states.

## 4. Additive migrations (all `20261016…`, none applied automatically)

Baseline (main, PR #129): `20261016120000_company_os_foundation.sql` — the 19-table `cos_*` Business Graph kernel. This branch adds `…130000_company_os_permissions`, `…130100_company_os_ledger_events`, `…130200_company_os_cos_graph` (tightens kernel RLS, composite FKs), `…130300_company_os_cos_gates` (approval gates), `…130400_company_os_work_decisions`, `…130500_company_os_studio_growth`, `…130600_company_os_comms_academy_ai`.

Logical entity → physical table (via `cos-adapter.ts`): `crm_companies`→`cos_companies`, `crm_contacts`→`cos_contacts`, `crm_leads`→`cos_leads`, `crm_opportunities`→`cos_opportunities`, `crm_proposals`→`cos_proposals`, `crm_contracts`→`cos_contracts`, `projects`→`cos_projects`, `deliverables`→`cos_deliverables`, `finance_invoices`→`cos_invoices`, `finance_payments`→`cos_payments`, `operational_tasks`→`cos_tasks`, `people_profiles`→`cos_workers`.

Rollback: `supabase/rollback/20261016130000_company_os_rollback.sql` (not in the migration chain; destructive; proven to restore the exact baseline by `tests/db/rollback.test.ts`).

### Database-enforced guarantees (proved against the real migration chain in `packages/company-os-engine/tests/db`)

1. **Tenant isolation.** Every table is `organization_id NOT NULL`; every link is a composite `(organization_id, id)` FK, so a child row can never reference another tenant's parent. No DELETE/TRUNCATE for end users; anon has zero privileges.
2. **Permission-scoped RLS.** Reads need the domain `*.read` permission, writes the `*.manage` permission (checked by `private.has_permission`). Clients/viewers see no Company OS data.
3. **Approval is not an application convention.** The ledger trigger blocks self-approval, payload tampering, expiry, approver spoofing and non-admin approval of CRITICAL actions. `finance_payments` (insert-only), contract signature, invoice issue/void, proposal send, content publish and ad-budget changes each **require a matching approved ledger row**, checked in `WITH CHECK` / trigger.
4. **No forged history.** Company OS events and audit rows can only be written as the caller (or an agent acting for the caller); Company OS payloads are invisible to members without `approvals.read`.
5. **No SECURITY DEFINER.** Zero new SECURITY DEFINER functions and zero new anonymous exposure (asserted). Guard triggers are SECURITY INVOKER; schema `private` stays closed to end-user roles (the triggers inline the permission lookup instead).
6. **Provenance as constraints.** AI assets must name provider + model; non-original sources need licence; variants need parent + channel; certified Academy rows need a timestamp.

## 5. Lifecycle (one connected graph)

```text
cos_leads ─► cos_companies + cos_contacts ─► cos_opportunities ─► cos_proposals ─► cos_contracts
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
