# RINADS Jewellery OS — Production MVP

Status: **paid pilot / design-partner release candidate**, not public GA.

This document defines the production boundary for Jewellery OS inside the shared RINADS platform. Jewellery OS must extend existing platform primitives rather than creating a second ERP stack.

## 1. Shared RINADS systems reused

Jewellery OS reuses the existing RINADS platform for:

- authentication and organization tenancy
- permissions/RBAC and Supabase RLS
- shared product catalog and variants
- customer profiles and CRM context
- orders, payments and order timeline
- fulfilment and returns
- inventory authority and stock movements
- procurement and suppliers
- workspaces and business locations
- audit/event infrastructure
- RINPO runtime and approval-governed intelligence

No independent jewellery-only copies of auth, customers, orders, payments, fulfilment, inventory or audit should be introduced.

## 2. Jewellery vertical extensions in this MVP

The production MVP adds the minimum jewellery-specific domain needed to turn the existing experience demo into an operational pilot:

1. **Jewellery item profile** — tag/design number, metal, purity, gross/net weight, stone attributes, making-charge configuration, wastage, HUID/hallmark/certification metadata; linked one-to-one to the shared product variant.
2. **Metal rate book** — organization/location-aware buy and sell rates by metal and purity with effective timestamps.
3. **Showroom appointments** — assisted-selling and consultation visits linked to organization/customer/location context.
4. **Old-gold assessment** — draft/approved/applied/cancelled exchange assessment records that can later link to the shared order.
5. **Karigar / goldsmith job work** — issued/received/wastage weights, labour and job status linked to the shared supplier model.
6. **Owner workspace** — tenant-bound dashboard and authenticated server actions for the above modules.
7. **Deterministic pre-tax price helper** — metal + wastage + making + stone subtotal. Tax rules are intentionally not hard-coded into this helper.

## 3. Security and data-integrity rules

- `organization_id` is the tenant boundary for every Jewellery OS table.
- Reads require active organization membership through the existing `private.is_org_member` helper.
- Writes use existing platform permissions (`commerce.catalog.write`, `commerce.order.manage`, `procurement.approve`, or `org.manage`).
- Jewellery records have **no anonymous direct-write policy**.
- Jewellery records have **no DELETE RLS policy**. Corrections use updates/status transitions so operational history is recoverable.
- Product/variant links are checked to belong to the same organization before profile writes are accepted.
- Location/workspace references are checked against the same organization where applicable.
- Demo mode must never write production data; write actions fail closed when demo mode is active.

## 4. Deliberate non-goals for this MVP

The following must not be simulated or advertised as production-ready until validated integrations and compliance work are complete:

- BIS/HUID external verification
- live bullion/gold-rate provider integration
- GST/e-invoice compliance automation beyond the shared platform capabilities that are independently validated
- accounting/payroll duplication inside Jewellery OS
- RFID/weighing-scale hardware drivers
- automatic old-gold settlement into an invoice without an approval workflow
- production RINPO autonomous actions outside the shared security gate

HUID is stored as jewellery metadata in this MVP; storage is **not** evidence of BIS verification.

## 5. Current platform dependencies / release gates

Jewellery OS must not be announced as generally available until these gates are green:

1. **Platform security drift remediation** — the current production function/RLS privilege hardening work must be approved and applied before Jewellery OS production cutover.
2. **RINPO security gate** — production RINPO hardening must pass before any Jewellery OS workflow allows RINPO to take governed actions.
3. **Inventory ledger authority** — the shared inventory K3 work must be the production authority; `product_variants.stock` remains a compatibility projection, not the Jewellery OS source of truth.
4. **Production migration** — `20261016100000_jewellery_os_mvp.sql` must be applied to the actual production Supabase project and verified.
5. **Owner portal production deployment** — the Jewellery route must be deployed from the approved commit with the correct production environment.
6. **Pilot tenant configuration** — organization, locations, roles, catalog, variants and starting inventory must be loaded for the pilot jeweller.
7. **UAT** — owner/admin/staff workflows and RLS cross-tenant tests must pass.
8. **Backup/backout readiness** — database backup/restore path and rollback decision owner must be confirmed before go-live.
9. **Smoke test** — authenticated production smoke tests must pass after deployment.

## 6. Thrissur founding-partner release model

Launch first as a paid design-partner programme for **3–5 jewellery businesses in Thrissur**. Do not use free pilots except for a tightly controlled internal sandbox.

Recommended commercial card for the pilot and subsequent standardization:

| Tier | Software | Annual prepaid | Implementation from | Best fit |
| --- | ---: | ---: | ---: | --- |
| Jewellery Start | ₹4,999/month | ₹49,900/year | ₹39,000 | one showroom / early digitisation |
| Jewellery Grow | ₹9,999/month | ₹99,900/year | ₹99,000 | growing jeweller / up to three locations |
| Jewellery Scale | ₹19,999/month | ₹1,99,900/year | ₹2,49,000 | multi-location / advanced workflows |
| Jewellery Enterprise | ₹40,000–₹1.5L+/month | contract | ₹5L–₹25L+ | groups, integrations, custom SLA |

Pilot discounts should be contractually explicit and time-bounded. A practical ceiling is a 15–20% founding-customer software discount for up to two years in exchange for structured UAT, referenceability subject to approval, and workflow feedback.

Third-party usage (WhatsApp/SMS, payment gateways, bullion feeds, courier APIs, AI consumption, hardware, travel) is pass-through or separately invoiced. Do not absorb variable third-party costs into the base subscription.

## 7. Pilot operating workflow / demo script

The production demo should show connected workflows rather than disconnected screens.

### Flow A — tagged jewellery sale

Metal rate → shared product/variant → jewellery tag/HUID/weight profile → customer/showroom appointment → order → payment → fulfilment → customer follow-up → owner/RINPO insight.

### Flow B — old-gold exchange

Customer → old-gold draft assessment → authorized approval → link credit to a shared order → payment balance → invoice/order trail.

The current MVP implements the **draft assessment record**. Approval and order application must remain a governed next-stage workflow before pilot go-live for jewellers that require exchange settlement.

### Flow C — karigar job work

Supplier/karigar → issue metal → job in progress → receive finished item → record wastage/labour → approved stock movement into the shared inventory ledger.

The current MVP implements the job record. Automatic inventory posting must use the shared ledger, not a Jewellery OS shadow stock table.

## 8. UAT matrix

The pilot cannot be declared live until at least the following tests pass:

| Area | Required test |
| --- | --- |
| Tenancy | User from Org A cannot select/update Org B Jewellery records |
| Catalog | Jewellery profile can only bind to a product + variant from the same org |
| Rate book | Authorized role can insert/update rates; unauthorized role cannot; no direct delete |
| Appointments | Valid guest/customer appointment persists under active org; cross-org location rejected |
| Old gold | Server calculates assessment values; invalid weights/deductions rejected; record starts as draft |
| Job work | Authorized procurement/owner role creates job; invalid metal/weight rejected; no direct delete |
| Demo mode | All Jewellery write actions fail closed |
| Orders | Existing production tenant order runtime reads/writes active org only |
| Inventory | Ledger movement is authoritative; compatibility stock projection is not used for final availability |
| HUID | Stored metadata can be searched/displayed; UI does not claim external verification |
| Audit | Sensitive workflow transitions are represented in the platform audit/event model before GA |
| Recovery | Restore/backout procedure is tested against a non-production environment |

## 9. Production cutover sequence

1. Merge only after security/platform dependency gates are resolved.
2. Apply and verify Jewellery migration in staging/dev.
3. Run RLS/policy/constraint/advisor checks.
4. Apply migration to production from the approved release process.
5. Deploy owner portal commit.
6. Configure the first Thrissur pilot organization and locations.
7. Import validated catalog/variant/tag/HUID data.
8. Reconcile opening inventory against the shared ledger.
9. Run UAT with owner + cashier/sales + inventory/procurement roles.
10. Enable pilot access; keep public website status at pilot/coming-soon until production acceptance is signed.
11. Measure onboarding hours, support hours, error rate, stock variance, billing/order cycle time and weekly active users for pricing/margin validation.

## 10. KPI / ROI instrumentation for the first 90 days

Measure each pilot on:

- implementation hours per showroom and per 1,000 SKUs
- migration exception rate
- stock reconciliation variance
- time to find a tagged item
- appointment-to-order conversion
- order processing time
- old-gold assessment turnaround time
- job-work ageing and overdue count
- support minutes per active user
- owner weekly active usage
- RINPO recommendation acceptance rate once the security gate permits it
- software gross margin after third-party consumption and support

The commercial objective is to move Jewellery OS from founder-intensive custom deployment to a repeatable implementation package. Scale pricing only works if onboarding and support are standardized rather than treated as unlimited custom development.
