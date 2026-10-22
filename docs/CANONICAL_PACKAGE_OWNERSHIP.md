# Canonical Package Ownership

Date: 2026-10-22
Status: Wave 0 baseline

This document defines where new reusable capability must land so RINADS does not fragment into parallel products.

| Concern | Canonical location | Migration sources | Rule |
| --- | --- | --- | --- |
| Authentication | `packages/auth` | RINADS ONE, client auth implementations | Shared identity only |
| Tenancy | `packages/tenancy` | RINADS ONE, tenant repos | One organization/membership model |
| Permissions | `packages/permissions` | legacy role systems | Central RBAC + RLS |
| Platform contracts | `packages/platform` | old BOS/RI experiments | Shared cross-domain contracts |
| Database | `packages/database` + `supabase/` | client schemas | Tenant-safe canonical schema |
| Intelligence | `packages/intelligence` | Rinads-Intelligence, RINPO experiments | Reasoning/recommendation layer; no direct unsafe side effects |
| Runtime | `packages/runtime` | RINADS ONE events, RINPO runtime experiments | Execute tools/workflows/approvals/audit |
| Company/Business OS | `packages/company-os` | RINADS ONE, Business OS prototypes | Generic company capability model |
| Operations | `packages/operations` + `operations-server` | Active Innovative, Ambady admin, BRD workflows | Projects, tasks, fulfilment, work graph |
| Commerce | `packages/commerce` + `commerce-server` | Ambady, Bhima, Linea/Charliecsons | Generic catalog/cart/order/checkout contracts |
| Billing | `packages/billing` | MyCEO, payment prototypes | Plans, invoices, payments, provisioning triggers |
| Domains | `packages/domains` | custom client domains | Host-to-tenant mapping |
| CMS | `packages/cms` | marketing/client pages | Structured public content |
| Brand | `packages/brand` | Cozy/RINADS Studio/Brand Kit | Tokens/brand primitives only |
| UI | `packages/ui` | Cozy Code Library, Studio sandbox | Shared accessible UI primitives |
| Salon | `packages/salon` + `salon-server` | R GLOW, Fab, Kabini, Salon ERP | R GLOW industry pack logic |
| Shipping | shipping package/router in canonical repo | Ambady, Bhima logistics | Provider-neutral adapters |
| Communication | new `packages/communication` | Communication OS, RINCALL, Call Connect Hub | CRM comms contracts; providers remain adapters |
| RINPO Phone | shared shell package under RINPO/communication boundary | RINADS ONE, desktop Lovable prototype | Portable UI, not a separate operating platform |
| Work Graph | extend `operations` / `company-os` | Active Innovative, Work OS sheet | Work units, skills, risk, routing, QA |
| Growth | new capability package after Work Graph | Marketing Command Center, Social OS | Campaign/lead/funnel contracts |
| Studios | creative capability package after Growth | rinads-studio, Runway/Remotion work | Workflow/approval/asset metadata, not editor replacement |
| Academy/Labs | new learning/work-verification package | Academy, Labs concepts | Learning → work → evidence → verification |
| World adapters | API boundary to `RinadsWorld` | RinadsWorld | No direct raw ERP table access |

## Application ownership

| Experience | Canonical app |
| --- | --- |
| Public master site | `apps/website` |
| RINASPACE entry | `apps/website/app/space` during Wave 0; may become a dedicated app only if scale/routing requires it |
| Business/owner operations | `apps/owner-portal` |
| Customer account | `apps/customer-portal` |
| Commerce storefront | `apps/storefront` |
| R GLOW | `apps/rinaglow` |
| Platform administration | `apps/platform-admin` |
| RINADS WORLD | separate `RinadsWorld` repo/app with canonical API contracts |

## No-new-shell policy

Before creating a new app or repository, answer all three:

1. Can this be a route inside an existing RINASPACE experience?
2. Can this be a package capability consumed by existing apps?
3. Is a separate runtime/deployment boundary technically required?

If answers 1 or 2 are yes, do not create another independent product shell.
