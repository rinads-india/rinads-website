# R GLOW Phase E — Slice 2 (Deferred Scope)

Slice 1 (this PR) delivers one complete, real loop end-to-end:

`Segment -> Draft campaign -> Audience preview (with exclusions) -> Approve -> Send -> Real Twilio delivery -> Webhook-driven delivery states -> Conversion attribution -> Growth intelligence -> RINPO`

Per the master prompt's own guidance ("prefer one real vertical slice over many superficial features"), the following areas of the Phase E master prompt are **intentionally deferred** to a follow-up Phase E.2 PR, rather than implemented shallowly alongside the slice above:

## Loyalty ledger
- `loyalty_programs`, `loyalty_accounts`, `loyalty_ledger_entries` tables.
- Earning, redemption, refund reversal, expiry, and controlled manual adjustments.
- Loyalty-liability growth-intelligence metric.
- A dedicated `/loyalty` console page.

## Review-request workflow
- Post-visit review/feedback request automation.
- Escalation and reputation-workflow handling.
- Review-related growth-intelligence metrics.

## Reactivation workflow polish
- This slice supports reactivation **campaigns** (via `campaignType: "reactivation"` and `create_reactivation_draft`/`send_reactivation_batch` RINPO tools), reusing the same segment/campaign machinery as custom campaigns.
- Deferred: no-show recovery and unconfirmed-booking recovery as distinct triggered workflows (as opposed to operator-initiated segment criteria).

## Bulk retry
- `retry_failed_message` (single message) is implemented and exposed both as a RINPO SENSITIVE tool and a per-recipient "Retry" button on the campaign detail page.
- `retry_failed_message_batch` (retry every failed/dead-lettered message in a campaign at once) is deferred.

## Console UI
- Dedicated `/communications` page (a unified inbox/log view across all notification channels, independent of campaigns) is deferred — this slice's `/campaigns/[id]` detail page already shows per-recipient delivery status and the `/growth` page surfaces aggregate message-failure counts, which covers the sliced loop's operational needs.
- `/loyalty` page (see above).

## Verification limitation: real Twilio delivery

This environment does not have `RINADS_TWILIO_SID` / `RINADS_TWILIO_TOKEN` / `RINADS_TWILIO_WHATSAPP_FROM` configured, so end-to-end delivery through the real Twilio WhatsApp API could not be exercised live in this environment. The implementation is designed to fail honestly rather than fabricate success:

- `notify-whatsapp` returns `{"status":"not_configured"}` (never `"sent"`) when any of the three secrets is missing, and the outbox worker maps that to a `not_configured` status rather than treating it as a delivery failure or a success.
- Once real Twilio credentials are added (via Supabase Edge Function secrets / Cloud Agent Secrets), the same code path performs the real Messages API call, and the `notify-whatsapp-webhook` function (signature-verified with `RINADS_TWILIO_TOKEN`) will drive `sent -> delivered -> read` / `failed` transitions from Twilio's actual status callbacks.
- All adapter logic (`createTwilioWhatsAppAdapter`, `mapTwilioStatusToOutboxStatus`, `isForwardStatusTransition`) and the webhook's signature verification are covered by unit tests using a mocked `fetch`/HMAC, so behavior for success, non-2xx, and missing-config cases is verified without needing live credentials.
