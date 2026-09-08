# R GLOW Phase D + RINPO Integration — Master Implementation Prompt

## Mission

Extend the merged RINADS platform foundation into the first commercially complete vertical: **R GLOW Salon OS**, while making RINPO the natural intelligence and action interface.

Do not redesign the platform architecture. Do not create another repository. Do not create another database model for the same concepts. Build forward from `main` after the merged R GLOW production foundation.

Canonical repository:
- `rinads-india/rinads-website`

Canonical website app:
- `apps/website`

R GLOW app:
- `apps/rinaglow`

Existing domain packages:
- `@rinads/salon`
- `@rinads/salon-server`

## Non-negotiable principles

1. Preserve existing RINADS multi-tenancy using `organization_id`.
2. Preserve and extend RLS. Never bypass tenant boundaries from client code.
3. Never trust client-supplied prices, payment states, permissions, organization IDs, staff IDs, or appointment ownership.
4. Financial, destructive, production, messaging, and externally visible actions must pass centralized authorization/policy and approval rules where required.
5. Public booking must continue to use controlled public RPCs/server actions; never expose organization-scoped salon tables directly to anonymous clients.
6. Do not expose internal architecture names such as Business Graph, Tool Router, Agent Runtime, or infrastructure details in public marketing copy.
7. Keep RINPO model-provider agnostic. Do not hard-code the platform to one LLM provider.
8. Reuse existing shared packages and database types. Avoid parallel abstractions.
9. Build a vertical slice that is demonstrably usable by a real salon before adding broad generic features.
10. No production database/destructive Vercel changes as part of this implementation branch.

## Target R GLOW operating loop

Customer → Booking → Appointment → Service → Checkout → Payment → Invoice → Follow-up → Review/Loyalty → Marketing → Intelligence → RINPO action.

The system must maintain a reliable event/audit trail for important transitions.

## Phase D scope

### A. Salon operations

Implement/complete:
- appointment lifecycle: requested, confirmed, checked-in, in-service, completed, cancelled, no-show
- reschedule and cancellation rules
- staff availability and working hours
- branch business hours
- service duration/buffer rules
- conflict-safe scheduling
- appointment notes with appropriate privacy controls
- customer appointment history
- staff day/week calendar views
- operational dashboard

Do not weaken the existing double-booking protection. Keep database-level conflict safety as the final authority.

### B. POS and checkout

Add a server-authoritative checkout domain.

Support initially:
- cash
- UPI
- card
- Razorpay where appropriate

Model:
- sale
- sale_lines
- discounts
- taxes if already defined by the existing accounting/tax model
- payments
- payment attempts
- refunds
- receipts/invoices

Requirements:
- calculate totals server-side
- never accept final amount from browser as authority
- idempotency keys for payment operations
- immutable financial event/audit record
- explicit refund permissions
- safe handling of partial/split payment if included
- reconciliation-ready status model

Reuse `@rinads/billing` where appropriate instead of creating another billing abstraction.

### C. Customer relationship layer

Implement:
- customer profile
- visit history
- service history
- spend summary
- last visit
- preferred staff/services where supported
- consent/communication preferences
- customer tags/segments
- reactivation candidates

Do not expose sensitive customer data unnecessarily in public routes.

### D. WhatsApp/customer communication

Create provider-neutral notification interfaces.

Events:
- booking.created
- booking.confirmed
- booking.rescheduled
- booking.cancelled
- appointment.reminder_due
- appointment.completed
- payment.received
- invoice.ready
- review.request_due
- customer.reactivation_due

Implement templates and delivery/audit records.

Use real provider credentials only through server-side environment variables. Never place provider secrets in the client.

If the provider integration is not yet configured, implement a safe adapter/stub and observable delivery state rather than fake successful delivery.

### E. Loyalty

Create a minimal extensible loyalty model:
- loyalty_account
- points_ledger
- earning rule
- redemption rule
- expiry policy

Ledger entries must be append-only from the application perspective. Do not directly mutate a customer's balance as the source of truth.

### F. Salon intelligence

Create server-side derived metrics:
- today's appointments
- completed appointments
- cancellations
- no-shows
- revenue
- outstanding amount
- average ticket
- repeat-customer rate
- staff utilization
- empty slots
- service performance
- customer reactivation opportunities

Do not hard-code a single dashboard query if the same signals will later feed RINPO. Prefer reusable query/service functions.

## RINPO integration

RINPO must become an action interface over the R GLOW domain, not a second dashboard.

### User examples

`RINPO, how is R GLOW doing today?`

`RINPO, show me today's empty slots.`

`RINPO, which customers haven't returned in 60 days?`

`RINPO, which staff members have low utilization today?`

`RINPO, send appointment confirmations to the three unconfirmed customers.`

`RINPO, create a reactivation campaign for customers inactive for 90 days.`

`RINPO, give me today's revenue and explain what changed.`

### Required RINPO tool categories

READ tools:
- get_salon_business_summary
- get_today_appointments
- get_staff_utilization
- get_empty_slots
- get_customer_history
- get_reactivation_candidates
- get_revenue_summary
- get_service_performance
- get_pending_payments
- get_customer_communication_preferences

WRITE/EXECUTE tools:
- create_appointment
- reschedule_appointment
- cancel_appointment
- create_customer_followup
- send_appointment_confirmation
- send_appointment_reminder
- create_reactivation_campaign
- create_staff_task
- create_customer_note
- issue_receipt_or_invoice where authorized

SENSITIVE/FINANCIAL tools:
- record_payment
- initiate_refund
- modify_pricing
- modify_discount

These must enforce the existing permission and approval architecture. Never infer authorization from the natural-language request.

## RINPO execution pipeline

User
→ RINPO intent
→ planner
→ tenant/context resolution
→ permission check
→ policy check
→ approval if required
→ domain tool
→ transaction
→ event
→ audit log
→ result
→ intelligence update

The model must never directly execute arbitrary SQL.

## Event model

Use existing event infrastructure if present. Add only missing domain events.

Minimum events:
- salon.customer.created
- salon.booking.created
- salon.booking.confirmed
- salon.booking.rescheduled
- salon.booking.cancelled
- salon.appointment.checked_in
- salon.appointment.completed
- salon.appointment.no_show
- salon.payment.created
- salon.payment.succeeded
- salon.payment.failed
- salon.refund.created
- salon.invoice.created
- salon.message.sent
- salon.message.failed
- salon.loyalty.points_earned
- salon.loyalty.points_redeemed
- salon.campaign.created

Events must include organization/tenant context and safe metadata.

## Data model rules

Before adding migrations:

1. Inspect existing tables and types.
2. Reuse existing organization/user/role/permission primitives.
3. Reuse existing customer, order, payment, billing, CMS, messaging, campaign, and event concepts where they are semantically correct.
4. Add salon-specific tables only when the generic model cannot represent the domain safely.
5. Every tenant-owned record requires an organization boundary.
6. Add foreign-key indexes where justified.
7. Add RLS policies with explicit tests.
8. Avoid SECURITY DEFINER unless there is a clear boundary reason. If used, pin `search_path`, minimize grants, and test anonymous/authenticated/service-role behavior.

## Public booking

Keep the existing flow:

service → staff/any → slot → contact → confirmation

Enhance it with:
- branch selection when multiple branches exist
- timezone-safe slot display
- service duration
- availability validation immediately before booking
- idempotency protection
- clear booking reference
- confirmation state

Anonymous users may only access intentionally public salon information and booking operations.

## R GLOW owner/staff console

Dashboard:
- today's business summary
- appointments
- revenue
- attention items
- empty slots
- customer follow-ups
- RINPO command input

Calendar:
- day/week
- branch
- staff
- appointment state
- reschedule/cancel/check-in/complete

Customers:
- search
- profile
- visits
- payments
- notes
- communication preferences
- reactivation

POS:
- appointment-to-sale conversion
- cart/service lines
- discounts
- payment
- receipt/invoice
- refund permissions

Staff:
- profile
- services
- availability
- utilization
- appointments

Services:
- service catalog
- duration
- price
- active/inactive

Marketing:
- segments
- campaigns
- templates
- delivery status

Settings:
- branch
- business hours
- staff schedules
- communication settings
- payment settings
- permissions

## RINPO UX

RINPO should be persistent but not intrusive.

Provide:
- command bar
- contextual suggestions
- conversational history
- action preview
- approval card
- execution result
- audit/reference link where appropriate

Example action preview:

> **Send 3 appointment confirmations?**
> RINPO found 3 unconfirmed appointments for today.
> Channel: WhatsApp
> Recipients: 3
> Estimated messages: 3
>
> [Approve & Send] [Cancel]

For read-only actions, no approval should be required unless policy says otherwise.

## Intelligence

The first R GLOW intelligence experience should answer:

> “What needs attention now?”

Rank signals using:
- business impact
- urgency
- confidence
- reversibility
- available evidence

Do not fabricate metrics. If data is unavailable, say so.

## Testing requirements

Before completion:

- typecheck
- lint
- unit tests
- database migration validation
- RLS tests
- tenant isolation tests
- public RPC tests
- booking concurrency/double-booking test
- payment idempotency test
- server-side price authority test
- refund permission test
- RINPO authorization test
- approval enforcement test
- communication preference test
- timezone conversion test
- build all affected workspaces

Minimum security scenarios:

1. Organization A cannot read Organization B data.
2. Anonymous user cannot query private salon tables directly.
3. Staff member cannot issue unauthorized refunds.
4. Staff member cannot change protected pricing unless explicitly permitted.
5. Client cannot alter payment status.
6. Client cannot change organization_id.
7. RINPO cannot bypass tool permissions.
8. RINPO cannot execute a financial/destructive action without required approval.
9. Duplicate payment webhook does not create duplicate financial effects.
10. Concurrent booking attempts cannot double-book a staff member.

## Deployment rules

This branch is implementation-only.

Do NOT:
- delete Vercel projects
- rename production domains
- change DNS
- switch production Supabase projects
- disable RLS
- rotate production secrets blindly
- import the `rinaglow` Vercel project as `www.rinads.com`

Deployment target:

GitHub branch → Vercel Preview → staging Supabase → automated checks → human approval → main → production.

The new Vercel `rinaglow` project detected from the GitHub repository must be treated as a candidate vertical deployment, not automatically as the canonical `www.rinads.com` deployment.

## Definition of Done

R GLOW Phase D is complete only when a salon owner can:

1. receive an online booking;
2. see it on the calendar;
3. check the customer in;
4. complete the service;
5. take payment;
6. issue a receipt/invoice;
7. send the customer a follow-up;
8. see customer history;
9. identify business opportunities through RINPO;
10. ask RINPO to perform an authorized action;
11. approve sensitive actions;
12. see the resulting action/event/audit state.

Then demonstrate the complete sentence:

> **“RINPO, check R GLOW and tell me what needs attention.”**

RINPO must answer from real tenant data, explain the evidence, and offer safe next actions.

## Engineering discipline

- Inspect before editing.
- Make the smallest coherent changes.
- Prefer existing abstractions.
- Do not duplicate domain models.
- Do not add fake integrations.
- Do not claim production deployment without verification.
- Do not mark deferred functionality as complete.
- Keep public marketing and internal architecture separate.
- Document migration dependencies and rollback considerations.

## Deliverables

Produce:

1. migrations
2. domain/server changes
3. R GLOW console changes
4. public booking enhancements
5. RINPO tools/actions
6. intelligence queries
7. tests
8. environment documentation
9. deployment/staging runbook
10. completion report listing shipped, deferred, and manually verified items

Create a focused PR from this branch. Do not merge it automatically.
