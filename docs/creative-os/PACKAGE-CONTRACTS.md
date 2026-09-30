# Creative OS — package contracts RFC stub (PR-C0)

**Status:** DRAFT RFC — not implemented  
**Date:** 2026-09-30  
**Depends on:** [PR-C0-INVENTORY.md](./PR-C0-INVENTORY.md), [CREATIVE-OS-V1-IMPLEMENTATION.md](./CREATIVE-OS-V1-IMPLEMENTATION.md)

## 1. Tenancy actors (planned)

`organisation → workspace → brand → project → generation_job / asset`

Reuse `@rinads/tenancy` org context. Workspaces are Creative-specific rows (PR-C1), not a fork of org membership.

Roles (planned permission keys — add in PR-C1 / permissions package, not now):

- `creative.brand.read|write`
- `creative.project.read|write`
- `creative.generation.create|cancel`
- `creative.credits.view`
- `creative.admin.reconcile` (founder/platform only, audited)

## 2. Generation API surface (planned BFF)

Provider-neutral; browser never holds model API keys.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/creative/assets/upload-intents` | Presigned private upload |
| CRUD | `/v1/creative/brands`, `/projects` | Org-scoped |
| POST | `/v1/creative/generations/quote` | Server rate-card only |
| POST | `/v1/creative/generations` | Idempotency key required |
| GET | `/v1/creative/generations/:id` | Status + events |
| POST | `/v1/creative/generations/:id/cancel` | Soft cancel |
| GET | `/v1/creative/credits/balance` | Ledger read |
| POST | `/internal/provider-webhooks/*` | Signed, idempotent |

Capabilities enum (planned): `POST_IMAGE`, `PRODUCT_IMAGE`, `CHARACTER_FRAME`, `IMAGE_TO_VIDEO`, `ACTOR_VIDEO`, `TTS`.

## 3. Job state machine (planned)

`created → quoted → reserved → queued → submitted → provider_running → postprocessing → storing → completed`

Terminal / control: `moderation_blocked`, `cancel_requested`, `cancelled`, `failed_retryable`, `failed_terminal`, `dead_letter`.

## 4. Billing extension (planned PR-C4)

Extend `@rinads/billing` — do not create a parallel payment stack.

Planned tables (names may adapt): `credit_accounts`, `credit_lots`, `credit_ledger`, `credit_reservations`, `credit_usage_events`, plus reuse/extend `payment_webhook_events` patterns from existing Razorpay webhooks.

Rules:

- Never trust browser quote or provider price for debit.
- Atomic reserve + job create; capture on success; release on terminal failure before usable output.
- Ambiguous provider charge → reconciliation queue, not uncontrolled retry spend.

## 5. Media (planned PR-C2)

Private object keys: `org/{org}/project/{project}/asset/{asset}/original`. Short-lived signed URLs. Public CDN exports only via explicit publish action.

## 6. Acceptance linkage

| Gate | Contract concern |
|------|------------------|
| B | RLS + signed URL negative tests |
| C | Idempotent payments + generations |
| D | Timeout-after-charge no double debit |
| E | Ledger reconciles locked credits |
| F | Consent / minors / likeness |
| H | Margin floor vs credit redemption |

Implementation PRs must cite this RFC and update it when contracts change.
