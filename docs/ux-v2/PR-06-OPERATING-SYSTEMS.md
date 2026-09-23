# RINADS UX V2 — PR-06 Operating Systems

## Objective

Replace the repeated generic Operating System marketing experience with one shared structural frame plus a signature product demonstration for each of the eight RINADS Operating Systems.

Routes remain unchanged:

- /platform/business-os
- /platform/commerce-os
- /platform/marketing-os
- /platform/logistics-os
- /platform/creative-os
- /platform/build-os
- /platform/academy-os
- /platform/automation-os

## Shared page structure

Every Operating System page now follows:

1. Hero
2. Signature product demo
3. Connected workflow
4. Modules / coordinated capabilities
5. RINPO in this Operating System
6. Related RINADS paths
7. CTA

The old repeated "Where it sits in the stack" section is removed. Platform architecture belongs on /platform, while each OS page now focuses on what that product actually feels like to use.

## Signature demonstrations

### Business OS — Founder Command Center

Demonstrates:

- receivables
- active leads
- active projects
- attention queue
- RINPO prioritization

### Commerce OS — Commerce Operations Flow

Demonstrates:

- Product
- Catalogue
- Storefront
- Order
- Payment
- Fulfilment
- Customer

The visual also shows fictional order state and a stock-risk recommendation.

### Marketing OS — Campaign Command Center

Demonstrates:

- campaign-level operating state
- spend / lead / CPL / follow-up metrics
- channel rows
- RINPO diagnosis

### Logistics OS — Shipment Control Tower

Demonstrates:

- provider-neutral shipment rows
- shipment state
- exceptions
- carrier handoff
- RINPO exception review

### Creative OS — AI Production Studio

Demonstrates:

- Brief
- Concept
- Script
- Image
- Video
- Voice
- Review
- Publish

RINPO is positioned as the contextual creative guide, not as unrestricted automatic publisher.

### Build OS — Software Factory

Demonstrates:

- Discovery
- PRD
- Architecture review
- Build plan
- Test
- Deploy
- Monitor

The demo emphasizes tenancy, permissions, data ownership, and review before implementation.

### Academy OS — Skill Graph + RINPO Tutor

Demonstrates:

- learner skill progress
- project readiness
- RINPO tutoring
- the Learn → Practice → Work → Ship → Measure → Improve → Certify model

### Automation OS — Workflow + Approval + Audit

Demonstrates:

- Trigger
- Condition
- Draft
- Approval
- Action
- Result
- Audit

The example intentionally stops at an approval gate to reinforce that higher-risk actions do not silently execute.

## Demo-data policy

Every signature demo is explicitly labelled as a demo using synthetic data.

No displayed amount, lead count, project count, order ID, campaign result, shipment ID, learner progress percentage, or execution timestamp should be interpreted as real customer data.

## RINPO behaviour

Each OS has its own page-aware RINPO prompt and example recommendation.

The page-level RINPO section makes the following boundary explicit:

- recommendation does not grant execution authority
- product mutation requires the implemented tool or runtime path
- permissions and confirmation remain in force
- one persistent RINPO interface is reused across Operating Systems

## Architecture boundary

This PR does not claim that all eight Operating Systems are equally mature as deployed products.

The purpose of the signature demos is to communicate the intended operating experience while staying explicit about synthetic data and execution boundaries.

Current code-backed product depth remains strongest in areas already represented by the monorepo, including commerce/operations/runtime and R GLOW. Other OS surfaces can evolve behind the same public page framework as implementation depth increases.

## Non-goals

- no route migrations
- no database changes
- no Supabase changes
- no auth/tenancy/RLS changes
- no runtime execution changes
- no new provider integration
- no customer metrics
- no fake live dashboards
- no claim that every demo action is currently executable
- no redesign of Intelligence or Cloud pages
- no vertical Solution redesign

## Tests

PR-06 adds tests that lock:

- exactly eight signature OS demos
- every signature demo has matching OS content
- Intelligence and Cloud are not treated as Operating System demos
- the generic WorkflowDiagram is removed from OsMarketingPage
- the shared OS frame contains the new connected-workflow section

## Follow-up

PR-07 should redesign the vertical Solution pages around the model:

Common RINADS core + industry-specific configuration.

Priority:

- Retail
- Landscape & Nursery
- Salon / R GLOW
- Jewellery
- Logistics
- Healthcare
