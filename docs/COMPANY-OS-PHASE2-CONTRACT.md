# Company OS — Phase 2 / Phase 3 contracts

Contracts for RINPO Company mode and the MCP Gateway. Phase 1 ships without these implementations; this document is the build target so Phone, context, and tools stay aligned with the Business Graph already in `@rinads/company-os`.

## Status

| Layer | Phase 1 (shipped) | Phase 2 (next) | Phase 3 |
|-------|-------------------|----------------|---------|
| Business Graph + events + approvals facade | Done | Consume | Same |
| `/os` Company shell (Home, Founder, Customers, Sales, Work, People, Finance, Approvals) | Done | Live data loaders | Unchanged |
| RINPO Phone Company audience + context engine | Stub / demo tabs | **Build** | — |
| MCP Gateway + core Bot skill bundles | — | Spec only | **Build** |

---

## 1. Dual-mode `/os` (unchanged)

- Customer tenants: Business OS nav (`Home / Customers / Work / Money / Growth / Automate`).
- Operator tenant (`organizations.is_platform_operator` or feature `company_os`): Company OS nav from `apps/website/lib/company-os-nav.ts`.
- Resolver: `isCompanyOsOrg` (`@rinads/company-os`) + `resolveCompanyOsMode` (`apps/website/lib/company-os-mode.ts`).

Do not fork tenancy, RBAC, or a second approval engine.

---

## 2. Phase 2 — RINPO Phone (Company mode)

### 2.1 Identity and audiences

- One RINPO identity; **personas = permission/context profiles**, not separate bots.
- Existing registry: `apps/website/lib/rinpo-phone-modes.ts`.
- Audience `founder`: company-wide Business Graph + Founder Attention queue.
- Audience `authenticated` (employee): scoped by existing RBAC + Company OS permission keys (`founder.*`, `clients.*`, `sales.*`, `work.*`, `finance.read`, `people.*`, `approvals.decide`, `ai.agent.execute`).
- Audience `public`: unchanged demo placeholders; no Company Graph leakage.

### 2.2 Phone tabs (align with mode registry)

| Mode id | Label | Company-mode data source |
|---------|-------|--------------------------|
| `today` | Today | Assigned tasks, deadlines, pending approvals, RINPO recommendations from attention + graph |
| `ask` | Ask | Context-engine answers over live graph (not generic LLM memory) |
| `actions` | Actions | Governed draft/propose tools; high-risk → Approvals Center |
| `approvals` | Approvals | `mergeApprovalInbox` unified DTO |
| `work` | Work | Projects / milestones / tasks for actor |
| `customers` | Customers | Client list + health (formula-transparent) |
| `money` | Money | Operating finance summary (revenue / receivables / expenses / AI cost) — not GST ledger |
| `growth` | Growth | Pipeline + growth stubs until Phase 4 |
| `apps` | Apps | Existing app grid |
| notifications | (alias) | Map to `approvals` / attention feed via `PHONE_SCREEN_ALIASES` |

### 2.3 Context engine contract

Input (server-resolved, never client-trusted for scope):

```ts
type CompanyOsPhoneContext = {
  organizationId: string;
  actorUserId: string;
  roleKey: string;
  permissions: string[];
  companyOs: true;
  scope: "founder" | "department" | "self";
  /** Live projections — omit or mark unavailable; never invent KPIs */
  pulse?: CompanyPulseSnapshot;      // Founder only when permitted
  attention?: AttentionItem[];       // ranked P0–P3
  myWork?: { tasks: TaskSummary[]; approvals: UnifiedApprovalInboxItem[] };
  clients?: ClientHealthSummary[];
  finance?: FinanceOperatingSummary | { unavailable: true; reason: string };
};
```

Rules:

1. Answers for founder commands must cite **live** graph rows or explicit `unavailable`.
2. Employee answers must respect `clients.read` / `work.read` / `finance.read` etc.; missing permission → deny, not hallucinate.
3. Writes go through Runtime policy + `requiresApproval` (existing intelligence/runtime path); never direct table writes from the model.
4. Emit Company OS events (`COMPANY_OS_EVENTS` in `@rinads/company-os`) via `@rinads/runtime` `business_events`.
5. Audit actor kind on material writes: `human | ai | system`.

### 2.4 Founder commands (minimum set)

| Intent | Behavior | Tool / source |
|--------|----------|---------------|
| “What’s urgent?” | Ranked attention P0–P3 | `get_founder_attention` |
| “Company pulse” | Pulse cards; honest empty | `get_company_pulse` |
| “Who needs follow-up?” | Stalled leads / overdue tasks | graph reads |
| “Approve X” | Open Approvals Center item; human decides | `approvals.decide` + Runtime |
| “Draft my closing” | Draft only; human submits | `daily_closing` draft |

---

## 3. Phase 3 — MCP Gateway + core Bots

### 3.1 Boundary

- Prefer first land under `@rinads/intelligence` / internal route; public hostname `mcp.rinads.com` later.
- All tools run through Runtime policy (permissions + approvals + audit).
- Grok / model policy: research / draft / recommend OK; **contracts, payments, deploys, permission changes** require approval.

### 3.2 Read tools (v1)

| Tool | Returns | Permission |
|------|---------|------------|
| `get_company_pulse` | Pulse metrics or unavailable markers | `founder.read` |
| `get_founder_attention` | Open `cos_attention_items` ranked | `founder.read` |
| `get_client_health` | Score + formula inputs | `clients.read` |
| `get_pipeline` | Lead → opportunity → proposal → contract | `sales.read` |
| `get_my_work` | Tasks / milestones for actor | `work.read` |
| `get_approvals_inbox` | Unified inbox DTO | `approvals.decide` or staff read |
| `get_finance_summary` | Operating summary or unavailable | `finance.read` |
| `get_capacity` | Worker capacity snapshots | `people.read` |

### 3.3 Controlled-write tools (v1)

| Tool | Effect | Approval |
|------|--------|----------|
| `create_task` | Insert `cos_tasks` | Low / medium per policy |
| `create_approval_request` | Queue via Runtime + `cos_approval_items` | Always creates approval row |
| `recommend_assignee` | Score only; assignment is separate | Read/recommend |
| `assign_task` | Write assignee; log override if ≠ recommendation | Manager; emit `assignment.overridden` |
| `propose_daily_closing` | Draft `cos_daily_closings` | Human submit |
| `request_client_followup` | Task + event | Medium |

High-risk (`approvals.decide`, `founder.decide`, `ai.agent.execute`) never implied by generic admin alone (`COMPANY_OS_HIGH_RISK_PERMISSIONS`).

### 3.4 Twelve core Bots = skill bundles

Not twelve separate Grok processes. Few agent definitions with skill packs:

| Bundle | Skills (illustrative) |
|--------|------------------------|
| Sales | pipeline, follow-ups, proposal drafts |
| Delivery | tasks, milestones, capacity recommend |
| Finance ops | receivables attention, invoice status (read) |
| People | capacity, skills match |
| Founder | pulse, attention, closing draft |
| Clients | health, account workspace summaries |
| Approvals | inbox merge, risk explain |
| Growth | (Phase 4 depth) |
| Studio | (Phase 4) |
| Ads | (Phase 4) |
| Engineering | (Phase 5) |
| AI ops | (Phase 5 cost/evals) |

---

## 4. Shared kernel references

| Concern | Location |
|---------|----------|
| Graph types / events / approvals merge / health / assignment | `packages/company-os` |
| Operator flag + `cos_*` tables + RLS + permission seeds | `supabase/migrations/20261016120000_company_os_foundation.sql` |
| Shell mode | `apps/website/lib/company-os-mode.ts`, `OsClient`, layout |
| Phone modes | `apps/website/lib/rinpo-phone-modes.ts` |
| Runtime jobs / approvals / events | `packages/runtime` |
| RINPO tools + `requiresApproval` | `packages/intelligence` |
| Kernel SoT | `docs/architecture/PLATFORM-KERNEL-CONTRACT.md` |

---

## 5. Non-goals (still deferred)

- Full statutory accounting / GST ledger
- Forked vertical DBs
- Dozens of separate Grok bots
- Autonomous high-risk writes
- Full Studio / Ads / Engineering product depth (Phases 4–5)
