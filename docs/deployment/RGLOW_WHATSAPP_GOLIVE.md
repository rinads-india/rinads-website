# R GLOW WhatsApp go-live (per organization)

Product code can enqueue WhatsApp into `notification_outbox`. **Sending stays off** until every layer below is explicitly flipped. This document is the ops sequence; do not enable live traffic from a code change.

Related: [RGLOW_PRODUCTION_CUTOVER.md](./RGLOW_PRODUCTION_CUTOVER.md), [../runbooks/RGLOW-COMMUNICATIONS-WORKER.md](../runbooks/RGLOW-COMMUNICATIONS-WORKER.md).

## Layers (all must be on)

| Layer | Default | Where |
|-------|---------|--------|
| Outbox enqueue | On (pending rows) | Booking RPCs, campaigns, automations |
| Org send flag `salon.whatsapp.send_enabled` | **Off** | `feature_flags` / `feature_flag_overrides` (Settings → Communications, or platform-admin) |
| Org mode | **off** | `organization_settings.settings.communications.whatsapp.mode` = `off` \| `sandbox` \| `live` |
| Sandbox allowlist | Empty | Same JSON; required when mode is `sandbox` |
| Communications worker | **Off** | Scheduler env `RINADS_COMMUNICATIONS_WORKER_ENABLED` |
| Worker org allowlist | Required when worker is on | `RINADS_COMMUNICATIONS_ORGANIZATION_IDS` |
| Twilio credentials | Unset → `{ status: "not_configured" }` | Edge Function secrets only |

Idempotency: enqueue uses `UNIQUE (organization_id, idempotency_key)`. Twilio callbacks use `UNIQUE (provider, provider_message_id, provider_status)` on `notification_delivery_events`. Status updates are monotonic (`sent → delivered → read`).

## Environment variables

### Edge Functions (`notify-whatsapp`, `notify-whatsapp-webhook`) — never `NEXT_PUBLIC_`

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL (injected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role only |
| `RINADS_TWILIO_SID` | Twilio Account SID (start with **sandbox**) |
| `RINADS_TWILIO_TOKEN` | Auth token (same token used to verify webhook signatures) |
| `RINADS_TWILIO_WHATSAPP_FROM` | `whatsapp:+…` sender |

Without the three Twilio keys the function writes `whatsapp_log` as `queued` and returns `{ status: "not_configured" }` — it never fabricates `sent`.

### Communications worker (credentialed scheduler, not the Vercel browser app)

| Variable | Purpose |
|----------|---------|
| `RINADS_COMMUNICATIONS_WORKER_ENABLED` | Must be exactly `1` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Claim + send |
| `RINADS_CRON_SECRET` = `RINADS_CRON_INVOCATION_TOKEN` | Per-tick auth |
| `RINADS_COMMUNICATIONS_ORGANIZATION_IDS` | Comma-separated org UUIDs (required; empty refuses to run) |
| `RINADS_COMMUNICATIONS_BATCH_SIZE` | Default 25, cap 100 |
| `RINADS_COMMUNICATIONS_THROUGHPUT_DELAY_MS` | Default 250 |
| `RINADS_COMMUNICATIONS_MAX_SCHEDULED_CAMPAIGNS` | Default 2, cap 10 |

Optional after a tick: `RINADS_REVIEWS_AUTOMATION_URL`, `RINADS_REVIEWS_AUTOMATION_TOKEN`, `RINADS_REVIEWS_AUTOMATION_LIMIT`.

Run: `pnpm communications:worker`.

### Console (glow.rinads.com)

No Twilio secrets. Operators configure flag/mode/allowlist in **Settings → Communications**. Status is also summarized at the top of **Communications**.

## Founder ops sequence (sandbox first)

1. Apply migration `20261019100000_salon_whatsapp_golive.sql` on the production Supabase project.
2. Deploy Edge Functions `notify-whatsapp` and `notify-whatsapp-webhook` with **sandbox** Twilio secrets.
3. Set Twilio status callback to `<SUPABASE_URL>/functions/v1/notify-whatsapp-webhook`.
4. Prove a bad webhook signature is rejected.
5. In R GLOW Settings → Communications, for **one** pilot org: mode = `sandbox`, add the founder test numbers, then turn **Send flag** on.
6. Enable the worker **only** with that org in `RINADS_COMMUNICATIONS_ORGANIZATION_IDS`.
7. Enqueue one transactional message (front-desk booking or RINPO reminder) to an allowlisted number.
8. Confirm outbox `pending → sent → delivered/read` (or honest `failed` / `not_configured`) on `/communications`.
9. Keep promotional campaigns off until consent + template approval.
10. Only after sandbox evidence: rotate to production Twilio credentials, switch that org to `live`, keep the worker allowlist explicit.

**Do not** set `RINADS_COMMUNICATIONS_WORKER_ENABLED=1` on a wide allowlist, and **do not** set mode `live` for every org, as part of merging this code.

## Operator UI

Settings → Communications shows:

- Send flag (default off)
- Mode (off / sandbox / live)
- Sandbox allowlist
- Outbox counts (queued, not configured, failed, dead letter)
- An honest note that worker + Twilio remain founder-controlled

Failures surface as `last_error` on `/communications` and on the message detail timeline. Retry requires `salon.communications.retry`.
