# RINPO Legacy Architecture Notice

The following artifacts are useful prototypes but are **not authoritative for RINPO Runtime v1**.

## April 2026 voice-agent architecture
Historical role:
- outbound/inbound call prototype
- n8n orchestration
- RetellAI telephony
- Google Sheets state
- OpenAI analysis
- Twilio/Slack/Gmail notifications

Retain as historical/requirements material under a legacy documentation area.

Salvage:
- call use cases
- phone validation
- transcript/post-call requirements
- alerting
- operational monitoring

Replace in the production core:
- n8n as the RINPO runtime
- Sheets as the system of record
- direct model dependency
- direct provider orchestration from the intelligence layer

Future voice path:

```text
Telephony Adapter
  -> Speech Adapter
  -> RINPO Runtime
  -> Context / Memory / Policy / Plan
  -> Typed Tool
  -> Domain Service
  -> Verification / Audit / Event
```

## Browser direct-model bridge
Historical role:
- browser-level model call
- scripted fallback
- hard-coded RINPO system prompt

Do not use it as production RINPO architecture because:
- the browser must not own model authority
- provider choice belongs behind ModelGateway
- authoritative tenant/identity context is server-derived
- hard-coded product claims can drift from deployed architecture

Replacement pattern:

```text
Browser / RINPO Phone
  -> POST /api/v1/rinpo/chat
  -> authenticate
  -> derive tenant + permissions
  -> context + memory
  -> policy / intent / planning
  -> model gateway when required
  -> typed tools / approval
  -> verification / audit
```

No model secret or execution authority belongs in client JavaScript.
