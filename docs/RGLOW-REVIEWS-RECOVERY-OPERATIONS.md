# R GLOW reviews and recovery operations

Phase E.2 Slice 2 adds the callable worker but intentionally does not add a production schedule. Slice 3 can invoke the same bounded endpoint from the chosen scheduler.

## Processing due work

An authenticated admin/manager with `salon.reviews.manage` can invoke:

```bash
curl -X POST https://<rinaglow-host>/api/automations/process \
  -H 'content-type: application/json' \
  -H 'origin: https://<rinaglow-host>' \
  -H 'cookie: <authenticated-session-cookie>' \
  --data '{"limit":50}'
```

The endpoint derives the organization from the authenticated session, rejects cross-origin calls, and clamps `limit` to 1–100. It scans completed visits, no-shows, and pending bookings, then enqueues only due work. Safe retries are expected: `(organization_id, idempotency_key)` is unique for both automation runs and notification outbox rows.

Default timing:

- Review request: two hours after completion.
- No-show recovery: two hours after the missed visit ends.
- Unconfirmed booking recovery: 24 hours before the appointment starts.

An organization-specific `salon_automation_rules` row can enable/disable a kind or change its delay. A changed appointment status is a stop condition. Opted-out customers and customers whose preferred channel is `none` are never enqueued.

## Feedback and escalation

Review messages carry `/feedback/<opaque-token>`. The public RPC accepts one response before expiry and exposes no tenant or customer details. Ratings 1–5 all finish on the same thank-you page. Ratings of 3 or below create an internal manager follow-up through the existing `salon_notes` staff-task path.

## Delivery health

The worker only writes `notification_outbox`; it never sends directly. The existing delivery worker/Twilio adapter remains responsible for transport.

If Twilio credentials are absent, WhatsApp delivery is honestly recorded as `not_configured`. Automation runs remain observable as queued and must not be described as delivered. Configure `RINADS_TWILIO_SID`, `RINADS_TWILIO_TOKEN`, and `RINADS_TWILIO_WHATSAPP_FROM` before expecting live delivery.

Monitor `/growth` for review responses, low-rating follow-ups, queued recovery, and conversions. Customer-level status is also visible on the client profile.

