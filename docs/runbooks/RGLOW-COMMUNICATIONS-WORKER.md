# R GLOW communications worker and retry runbook

The worker is disabled by default and performs no sends unless all controls below are explicitly configured.

## Schedule and credentials

Run `pnpm communications:worker` from a credentialed scheduler. Configure:

- `RINADS_COMMUNICATIONS_WORKER_ENABLED=1`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server/scheduler only)
- `RINADS_CRON_SECRET` and an equal per-invocation `RINADS_CRON_INVOCATION_TOKEN`
- `RINADS_COMMUNICATIONS_ORGANIZATION_IDS` as an explicit comma-separated tenant allowlist
- `RINADS_COMMUNICATIONS_BATCH_SIZE` (default 25, hard cap 100)
- `RINADS_COMMUNICATIONS_THROUGHPUT_DELAY_MS` (default 250)
- `RINADS_COMMUNICATIONS_MAX_SCHEDULED_CAMPAIGNS` (default 2, hard cap 10)

The database atomically claims due rows with `FOR UPDATE SKIP LOCKED`. Only approved campaigns with a due `scheduled_at` are advanced; approved unscheduled campaigns are never automatically sent.

Optionally set `RINADS_REVIEWS_AUTOMATION_URL` and `RINADS_REVIEWS_AUTOMATION_TOKEN` to trigger a separately configured reviews automation after a worker tick. Slice 3 does not depend on Slice 2 review files.

## Retry operations

Operators need `salon.communications.retry`. Direct authenticated updates to `notification_outbox` are revoked. Single and campaign retries call the same permission-checked RPC, reset attempts/errors/backoff, synchronize linked recipients to `pending`, and emit audit/business events. Bulk retries are capped at 100 and return `has_more`; repeat only after reviewing the previous result.

## Twilio production checklist

1. Use non-production Twilio sandbox credentials first: `RINADS_TWILIO_SID`, `RINADS_TWILIO_TOKEN`, and `RINADS_TWILIO_WHATSAPP_FROM`.
2. Complete WhatsApp sender registration and use approved templates for business-initiated conversations.
3. Configure the status callback URL as `<SUPABASE_URL>/functions/v1/notify-whatsapp-webhook`.
4. Confirm callback signature validation uses the same Twilio auth token and rejects invalid signatures.
5. Verify customer consent/opt-out capture and suppression before enqueue.
6. Set batch size and throughput delay below the Twilio account/sender rate limit; monitor 429/provider failures.
7. Send a small allowlisted test campaign, verify `sent -> delivered -> read` callbacks, then expand deliberately.
8. Rotate sandbox credentials before production and keep service-role/Twilio secrets out of browser environments and logs.

Mocked provider and HMAC signature tests passed. Live credentialed Twilio delivery has not been verified.
