# Company OS Phase 1 — Readiness

Operator dual-mode `/os` foundation + internal ops surfaces. Business OS tenants unchanged.

## Routes (Company mode)

| Route | Surface | Data |
|-------|---------|------|
| `/os` | Home — Today / My Work / Closing + Kanban | Demo store until live loaders |
| `/os/founder` | Founder Tower pulse + P0–P3 attention | Gated; honest unavailable KPIs |
| `/os/customers`, `/os/customers/[clientId]` | Account workspace + health formula | Demo |
| `/os/sales` | Pipeline board | Demo |
| `/os/work` | Project → milestone → task + recommend | Demo + `rankAssignees` |
| `/os/people` | Worker capacity | Demo |
| `/os/finance` | Operating summary | Demo / unavailable markers |
| `/os/approvals` | Unified Approvals Center | `mergeApprovalInbox` |
| Studio / Growth / Ads / Engineering / AI / Commerce / Logistics / Communication / Academy / Platforms / Assets / Reports | Nav + stub | Phase 4–7 |

## Kernel delivered

- `organizations.is_platform_operator` + `isCompanyOsOrg` / `resolveCompanyOsMode`
- `cos_*` Business Graph tables + member RLS
- Events catalog `COMPANY_OS_EVENTS`; permission seeds; approvals facade
- Package `@rinads/company-os`

## Events catalog (emit via Runtime)

See `packages/company-os/src/events.ts` — includes `lead.created`, `proposal.sent`, `task.completed`, `approval.requested`, `client.health.changed`, `assignment.overridden`, etc.

## Gaps → Phase 2

1. Wire Home / Founder / Customers / Sales / Work loaders to Supabase `cos_*` (replace demo store when operator org seeded).
2. RINPO Phone Company context engine (see `docs/COMPANY-OS-PHASE2-CONTRACT.md`).
3. Seed RINADS Technologies org `is_platform_operator = true` in target environments.
4. Tighten RLS beyond member-wide write (department / founder policies).
5. MCP Gateway + Bot skill bundles (Phase 3).

## Tests

- `packages/company-os/tests/company-os.test.ts` — org mode, events, assignment, health, approvals merge
- `apps/website/tests/company-os-shell.test.ts` — nav / mode / founder gate

## Next

**Phase 2:** RINPO Company Phone + live context over the Business Graph.
