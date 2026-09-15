# R GLOW Phase E — Growth & Automation Master Implementation Prompt

## Mission

Build Phase E on top of merged Phase D in the canonical `rinads-india/rinads-website` monorepo. Phase E converts R GLOW from a complete salon operating loop into a measurable retention, reactivation, communication, and growth system while preserving RINADS tenant isolation, approvals, auditability, and provider-neutral integrations.

Do not redesign Phase D. Do not create a new repository. Do not duplicate billing, CRM, messaging, campaign, event, or RINPO primitives when existing shared packages can represent the domain.

## Preconditions / release gate

Before production enablement, verify on the real production environment:
- merged Phase D is deployed from `main`;
- production Supabase migrations are applied;
- R GLOW auth/dashboard/booking/POS/payment/customer-history paths work;
- RINPO read path works with real tenant data;
- sensitive action approval still blocks unauthorized execution;
- cross-tenant isolation remains intact.

If production environment ownership cannot be verified from connected tooling, continue implementation only in Preview/staging and do not claim production release.

## Phase E scope

### A. Real customer communications

Turn the existing provider-neutral `notification_outbox` into real, observable delivery.

Implement:
- a server-side worker/job runner for queued notifications;
- WhatsApp provider adapter behind a stable interface;
- delivery states: queued, processing, sent, delivered, read where supported, failed, cancelled;
- provider message IDs and delivery callbacks/webhooks;
- retry policy with bounded exponential backoff;
- dead-letter handling;
- idempotent send semantics;
- consent and opt-out enforcement;
- template/version audit trail;
- per-organization sender/provider configuration;
- environment-safe secrets only on server/worker side;
- failure visibility in R GLOW and RINPO.

Do not fabricate delivery. If provider credentials are absent, remain in `not_configured`/`queued`/`failed` states as appropriate.

Initial event-triggered messages:
- booking confirmation;
- appointment reminder;
- reschedule/cancellation;
- payment receipt/invoice notice;
- review request;
- reactivation outreach.

### B. Loyalty ledger

Implement an append-only loyalty ledger, not a mutable balance field as source of truth.

Model:
- loyalty_programs;
- loyalty_accounts;
- loyalty_ledger_entries;
- loyalty_rules;
- loyalty_redemptions;
- loyalty_expiry_batches if expiry is enabled.

Support:
- earn on eligible completed/paid sales;
- redeem with server-authoritative validation;
- reversals on refunds where policy requires;
- expiry policy;
- branch/org scope;
- audit/event trail;
- RLS and tenant isolation;
- deterministic balance derived from ledger.

### C. Segmentation

Build reusable, server-side customer segmentation that can feed both UI and RINPO.

Initial segment operators:
- last visit date;
- visit count;
- lifetime spend;
- average ticket;
- preferred service;
- preferred staff;
- branch;
- loyalty balance/status;
- inactive X days;
- upcoming birthday where data/consent exists;
- communication opt-in/channel.

Segments may be saved or computed. Avoid copying customer rows into a second CRM.

### D. Campaign engine

Implement a minimal but real campaign lifecycle:

Draft → Audience Preview → Approval → Scheduled/Queued → Sending → Completed/Partial/Failed/Cancelled.

Campaign entity should include:
- organization;
- segment/audience definition;
- message template/version;
- channel;
- schedule;
- created_by;
- approved_by where required;
- estimated audience;
- actual attempted/sent/delivered/failed counts;
- attributable downstream conversions where measurable.

Do not allow RINPO to send a bulk campaign without permission/policy/approval.

### E. Reactivation automation

Create a closed reactivation loop:

Inactive customer signal → candidate list → exclusion/consent check → recommended offer/message → approval → send → response/booking → conversion attribution.

Initial examples:
- inactive 60 days;
- inactive 90 days;
- lapsed high-value customers;
- no-show recovery;
- abandoned/unconfirmed booking recovery where appropriate.

### F. Reviews / reputation

Implement post-visit review workflows without manipulating ratings.

Support:
- review-request scheduling after completed appointment/payment;
- destination/provider configuration;
- opt-out/consent;
- delivery audit;
- feedback capture if owned form is used;
- negative-feedback escalation task to staff/manager;
- RINPO summaries of feedback themes where real text exists.

Never gate review links based on predicted sentiment in a way that creates review suppression risk.

### G. Growth intelligence

Extend salon intelligence with:
- retention rate;
- repeat rate;
- reactivation candidates;
- reactivation conversion rate;
- campaign send/delivery/conversion metrics;
- loyalty issued/redeemed/outstanding liability estimate;
- cohort repeat behavior where feasible;
- staff/customer/service-level retention signals;
- message failure/opt-out anomalies;
- review request and response metrics.

Use shared query/service functions so R GLOW dashboards and RINPO read the same truth.

## RINPO Phase E capabilities

### READ tools
- get_reactivation_candidates
- get_customer_segments
- preview_segment
- get_campaign_performance
- get_message_failures
- get_loyalty_summary
- get_customer_loyalty_history
- get_review_workflow_summary
- get_retention_summary
- get_growth_opportunities

### WRITE tools
- create_segment
- create_campaign_draft
- create_reactivation_draft
- schedule_review_request
- create_followup_task

### EXECUTE / approval-required tools
- approve_campaign
- send_campaign
- send_reactivation_batch
- redeem_loyalty_points where policy requires
- adjust_loyalty_ledger via compensating entry only
- retry_failed_message_batch

RINPO must never bypass campaign audience preview, consent filters, permission checks, spend/rate limits, or approval policy.

## Natural-language examples

- `RINPO, which customers have not returned in 90 days?`
- `RINPO, create a reactivation campaign for high-value customers inactive for 60 days.`
- `RINPO, preview the audience before sending.`
- `RINPO, how did last week's reactivation campaign perform?`
- `RINPO, which messages failed today?`
- `RINPO, show loyalty liability and redemptions this month.`
- `RINPO, what growth opportunities need attention now?`

Deterministic intent handling may continue for supported commands. Preserve the provider-agnostic intent interface so a future LLM can be added without changing authorization or tool execution.

## Event model

Add only missing events, reusing existing event infrastructure:
- salon.notification.queued
- salon.notification.sent
- salon.notification.delivered
- salon.notification.failed
- salon.loyalty.earned
- salon.loyalty.redeemed
- salon.loyalty.reversed
- salon.segment.created
- salon.campaign.created
- salon.campaign.approved
- salon.campaign.started
- salon.campaign.completed
- salon.campaign.failed
- salon.reactivation.sent
- salon.reactivation.converted
- salon.review.requested
- salon.review.feedback_received

All events must carry organization context and safe metadata.

## Security / policy

Non-negotiable:
- RLS on every tenant-owned table;
- no service-role key in `apps/rinaglow` client bundle;
- no arbitrary SQL from RINPO/model output;
- opt-out enforced centrally;
- campaign sends rate-limited;
- webhook signatures verified when provider supports it;
- idempotent webhook processing;
- secrets only on server/worker/edge runtime;
- bulk messaging and loyalty adjustments audited;
- financial/discount/loyalty-value actions follow approval policy;
- append-only ledger semantics for loyalty;
- tenant isolation tests for every new table/RPC/service.

## UI additions

R GLOW console:

### Growth dashboard
- retention/repeat rate;
- reactivation opportunities;
- campaign results;
- loyalty health;
- communication delivery failures;
- review workflow status;
- RINPO growth command input.

### Customers
- segment membership/eligibility;
- loyalty ledger/history;
- consent/channel preferences;
- campaign/contact history.

### Campaigns
- drafts;
- audience preview;
- approvals;
- schedule;
- live/complete results;
- failures/retries.

### Loyalty
- programs/rules;
- account lookup;
- ledger;
- redemptions;
- manual compensating adjustment flow with permission/audit.

### Communications
- outbox/delivery status;
- provider state;
- template versions;
- failed messages;
- retry controls.

## Testing requirements

Minimum tests:
- tenant isolation for all new tables/services;
- opt-out blocks send;
- duplicate job does not duplicate provider send;
- duplicate webhook does not duplicate state transition;
- campaign audience excludes ineligible/opted-out recipients;
- campaign approval enforced;
- bulk-send rate-limit behavior;
- loyalty earn idempotency;
- loyalty refund reversal;
- loyalty redemption cannot overspend derived balance;
- loyalty manual adjustment uses compensating ledger entry;
- reactivation conversion attribution;
- review request timing;
- RINPO cannot bypass campaign approval;
- RINPO cannot alter loyalty balance directly;
- real provider adapter returns honest failure/not-configured state;
- typecheck/lint/test/build all affected workspaces.

## Deployment

Implementation path:

feature branch → Vercel Preview → Supabase Preview/staging → provider sandbox/test account → automated tests → manual E2E verification → focused PR → CI → human review → merge → controlled production enablement.

Do not:
- modify production DNS;
- delete or rename Vercel projects;
- change production Supabase project mapping without verification;
- enable real bulk messaging against production customers during development;
- import secrets into client code;
- claim Phase E complete while provider delivery remains simulated.

Use feature flags/config so real message dispatch can remain disabled until credentials, templates, webhook URLs, consent rules, and rate limits are verified.

## Definition of Done

Phase E is complete when a salon owner can:

1. identify a real reactivation audience;
2. preview exactly who will be contacted and why;
3. create/approve a campaign;
4. send through a real configured provider;
5. see accurate delivery/failure states;
6. measure bookings/revenue attributable to the campaign where evidence exists;
7. earn/redeem/reverse loyalty through an auditable ledger;
8. trigger review requests after real completed visits;
9. ask RINPO for growth opportunities;
10. ask RINPO to draft/execute a permitted growth action;
11. approve bulk/sensitive actions;
12. see events and audit history for the resulting execution.

Demonstrate:

> `RINPO, find my best reactivation opportunity, preview the audience, and prepare the campaign.`

Then, after explicit approval:

> `Send it.`

The result must be based on real tenant data, real consent rules, real provider state, and auditable execution.

## Engineering discipline

- Inspect before editing.
- Reuse Phase D primitives.
- Keep campaigns/segments generic enough to become RINADS shared primitives, but do not prematurely generalize unrelated vertical requirements.
- Prefer one real vertical slice over many superficial features.
- Preserve honest integration states.
- Document deferred items and production enablement requirements.
- Open a focused draft PR; do not merge automatically.
