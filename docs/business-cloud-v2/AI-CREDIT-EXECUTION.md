# RINADS AI Credits — execution contract

Status: foundation / pre-production.

This slice turns the append-only credit accounting model into a fail-closed execution gate for variable-cost RINPO, LLM, media, voice and automation operations.

## Runtime path

```text
estimated operation cost
       ↓
credit_reserve_units()
       ↓
external provider operation
       ├─ failed / cancelled → credit_release_reservation()
       └─ succeeded
              ↓
actual billable credits + provider-cost evidence
              ↓
credit_capture_reservation()
              ↓
usage event + negative append-only ledger entry
```

## Guarantees

- reserve/capture/release are service-role only;
- the tenant credit-account row is locked before balance-changing decisions;
- active, unexpired reservations reduce available balance;
- overspend fails closed before provider execution;
- reservation creation is idempotent;
- usage capture is idempotent and rejects parameter drift;
- actual billable credits may be lower than reserved credits;
- capture cannot exceed the reservation;
- captured reservations cannot be released;
- provider cost is stored internally and remains hidden from ordinary tenant members;
- capture emits `audit_logs` and canonical `business_events` evidence.

## Deliberate exclusions

- no browser/client mutation access;
- no credit purchase/top-up flow yet;
- no Razorpay credit pack checkout yet;
- no subscription credit grant worker yet;
- no expiring-lot/FIFO depletion policy yet;
- no provider-specific metering adapters yet;
- no UI balance/usage dashboard yet.

Until lot expiry/depletion is implemented, production grants should use non-expiring policy only. Do not sell expiring packs on top of this foundation.

## Next wiring

Priority consumption adapters:

1. RINPO / model gateway;
2. Runway live character sessions and generated media;
3. OpenAI / Anthropic / Google model calls;
4. ElevenLabs / voice generation;
5. Creative OS image/video generation;
6. research/automation jobs with measurable third-party cost.

Every adapter should estimate and reserve first, then capture actual billable usage or release on failure. Provider retries must reuse stable idempotency keys.
