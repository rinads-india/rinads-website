# Canonical Communication Contract

Date: 2026-10-22
Status: P2 foundation

## Decision

RINADS owns customer/lead identity, communication history, policy decisions and RINPO-derived work. External telephony and messaging vendors are replaceable adapters.

The migration sources are:

- `RINADS-ONE` — RINCALL provider abstraction and RINPO call-event contracts
- `rinads-rinpo-AI-Native-Business-Communication-OS` — stronger telephony contracts and fail-closed Calliyo capability model
- Lovable `Call Connect Hub` — UI reference for calls, pipeline, WhatsApp inbox and agent performance
- existing canonical Runtime notification outbox — delivery execution/idempotency foundation
- existing R GLOW communication worker — proven fail-closed WhatsApp delivery behavior

## Boundaries

### `@rinads/communication`
Owns:

- canonical communication channel/provider types
- canonical call/message events
- telephony provider interface
- provider verification/capability status
- consent/message-policy helpers
- RINPO communication-analysis event contracts
- webhook idempotency-key contract

Does not own:

- CRM/customer tables
- tenant identity
- secrets
- transport retries/outbox processing
- provider-specific persistence
- raw provider credentials

### `@rinads/runtime`
Continues to own execution, outbox processing, retries, approvals and audit-oriented workflow behavior.

### CRM / Company OS
Remains the system of record for leads/customers and the business activity timeline.

## Calliyo rule

Calliyo stays `contract_pending` until all of the following exist:

1. account-specific API documentation,
2. credential scope and storage contract,
3. webhook signing/verification contract,
4. sandbox/test account or equivalent deterministic test path,
5. implemented adapter methods,
6. contract tests using vendor-approved fixtures,
7. end-to-end tenant isolation and idempotency verification.

Credentials alone MUST NOT make the provider live.

## Messaging policy

Automated outbound messaging must fail closed on explicit opt-out. Business-initiated WhatsApp automation additionally requires recorded opt-in evidence and an approved template key in the canonical policy helper. Provider/channel rules may be stricter and must be enforced at the adapter boundary as well.

## Next slices

1. canonical communication persistence/activity contract
2. inbound webhook ingress + signature verification + idempotency
3. CRM lead/customer matching
4. RINPO summary/next-action generation
5. Work Graph follow-up creation
6. Calliyo adapter only after contract verification
7. RINPO Phone inbox/call-history UI
