# RINPO appointment confirmation pilot

**Date:** 2026-09-25  
**Status:** Code on branch — **does not** enable Twilio or communications workers.

## Pilot workflow

1. Operator (with `salon.pos.manage`) asks RINPO to send an appointment confirmation.
2. Tool `send_appointment_confirmation` is **SENSITIVE + requiresApproval**.
3. RINPO builds a **draft preview** (masked phone, channel, copy, booking time) scoped to the active organisation.
4. Approver confirms via existing RINPO approval UI (`resolveSalonRinpoAction`).
5. On approve, message is **queued** to notification outbox — delivery still requires Twilio secrets + worker enablement (founder-gated).

## Safety

| Control | Behaviour |
|---------|-----------|
| Tenant scope | Appointment/customer `organizationId` must match active org |
| Permission | `salon.pos.manage` to draft; approval path uses existing `rinpo_actions` |
| Explicit approval | No silent enqueue from the command alone |
| Budget | Soft daily tool-call / cost budgets (`RINADS_RINPO_DAILY_TOOL_BUDGET`, `RINADS_RINPO_DAILY_COST_BUDGET_USD`) |
| Observability | Structured `rinpo.observation` logs: latency, cost (0 deterministic), failure, pendingApproval, approvedActionCompleted |
| Voice/Phone marketing | Unchanged — still not this pilot |

## Non-claims

- Not live WhatsApp delivery until Twilio + worker sign-off.
- Public website `/api/chat` remains rule-based / demo — not this pilot.
