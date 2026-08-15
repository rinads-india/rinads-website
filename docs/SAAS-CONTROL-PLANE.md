# SaaS Control Plane — Phase 11 Gap Matrix

**Date:** 2026-08-15  
**Branch:** `cursor/phase-11-saas-control-plane-4e75`

## Objective

Turn the Phase 10 ERP engine into a **multi-tenant SaaS platform**: provision organizations, resolve session → org context, enforce RLS, and operate a founder control plane — without cloning apps per tenant.

## Handoff from Phase 10

| Phase 10 deliverable | Phase 11 action |
|---------------------|-----------------|
| `@rinads/operations` domain | Unchanged APIs; org from resolver |
| In-memory `AMBADY_ORG_ID` | Replace in Supabase mode |
| Partial RLS | Complete policies + role grants |
| `create_organization` RPC | Wire onboarding + platform-admin |
| Demo portals (no auth) | Middleware + tenancy resolver |

## Gap matrix

| Area | Before Phase 11 | Target | Package / app |
|------|-----------------|--------|---------------|
| Tenancy context | Hardcoded demo | Session + active org cookie | `@rinads/tenancy` |
| Tenant provisioning | RPC only | Template seed + jobs | `@rinads/platform` |
| Platform admin | None | Founder control plane | `apps/platform-admin` |
| Onboarding UI | None | Post-signup create org | `apps/website` |
| Portal auth | None | Supabase middleware | storefront, customer-portal, owner-portal |
| Persistence | In-memory | Supabase hydrate/persist | `operations-server/factory` |
| Subscriptions | None | Plans + org attachment | migration + platform-admin |
| Feature flags | Schema only | Runtime evaluator | `@rinads/tenancy` |
| Member invites | None | Invite table + accept RPC | migration |
| Ambady Tenant #1 | Demo string ID | Real org slug `ambady` | provisioning template |

## Architecture

```
Supabase Auth → TenancyContextResolver → active organization_id
                    ↓
         CommerceContext / OperationsContext
                    ↓
    Domain services (@rinads/commerce, @rinads/operations)
                    ↓
    Repository factory (demo in-memory | Supabase hydrate/persist)
                    ↓
              PostgreSQL + RLS
```

## Non-negotiables

- RLS is enforcement; UI checks are not authorization
- `founder` / `super_admin` assignment requires service role
- Provisioning mutations write `audit_logs`
- Marketing website does not host ERP control plane ([ADR-003](decisions/ADR-003-core-boundaries.md))

## References

- [PHASE_10_COMPLETION_REPORT.md](./PHASE_10_COMPLETION_REPORT.md)
- [TENANT-PROVISIONING.md](./TENANT-PROVISIONING.md)
- [ORG-CONTEXT.md](./ORG-CONTEXT.md)
- [PLATFORM-SECURITY.md](./PLATFORM-SECURITY.md)
