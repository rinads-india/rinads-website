# R GLOW Phase D — Scope Decision

## Decision

Implement **Option A** for both Phase D scope and RINPO natural-language understanding.

This decision is authoritative for the implementation branch and resolves the two scope questions raised during implementation review.

---

## 1. RINPO natural-language understanding — Option A

The current codebase has no LLM provider wired into the application and existing ADRs intentionally avoid an LLM gateway at this stage.

Therefore Phase D MUST NOT introduce a real LLM provider, provider API key, or Vercel AI SDK dependency merely to demonstrate natural-language commands.

Implement a **deterministic intent parser with a provider-agnostic adapter seam**.

### Required behavior

Support the approved R GLOW command vocabulary and close natural-language variants, including:

- `RINPO, how is R GLOW doing today?`
- `How is the salon doing today?`
- `Show today's empty slots`
- `Which customers haven't returned in 60 days?`
- `Who has low utilization today?`
- `Send appointment confirmations to the three unconfirmed customers`
- `Give me today's revenue`
- `Create a staff task for Anu`

The parser should normalize input into a typed intent such as:

```text
Intent {
  name
  entities
  filters
  requestedAction
  confidence
}
```

The intent output then enters the existing authorization/tool pipeline. The parser MUST NOT receive direct database access and MUST NOT execute tools itself.

### Provider seam

Create a small interface that can later accept a real model-backed parser without changing the downstream tool pipeline, for example:

```text
IntentInterpreter
  -> interpret(input, context)
  -> IntentResult
```

Phase D implementation:

```text
DeterministicIntentInterpreter
```

Future implementation may add:

```text
LLMIntentInterpreter
```

without changing:

```text
intent -> context -> permission -> policy -> approval -> tool -> event -> audit
```

Do not claim that the Phase D parser is a general-purpose LLM. It is deterministic natural-language command interpretation for the supported command surface.

Unsupported or ambiguous phrasing must return a safe clarification/unsupported response rather than guessing.

---

## 2. Phase D product scope — Option A

Ship **one complete production-grade R GLOW operating loop**, rather than thin implementations of every subsystem.

### Ship now

```text
Booking
  -> Appointment
  -> Check-in
  -> Service
  -> POS / Checkout
  -> Payment
  -> Invoice / Receipt
  -> Follow-up notification abstraction
  -> Customer history
  -> RINPO read/action tools
```

The shipped vertical slice must be coherent, testable, and usable by a real salon.

### Production rigor required on the shipped path

- tenant isolation
- RLS
- server-authoritative financial calculations
- idempotent payment effects
- payment/reconciliation state machine
- refund authorization
- booking concurrency protection
- audit trail
- event trail
- communication preference enforcement
- RINPO permission enforcement
- approval enforcement for sensitive actions
- public/private data boundary
- migration safety
- staging verification

---

## 3. Explicit Phase E deferrals

The following are **NOT Phase D completion requirements** and must not be represented as shipped merely because their database/UI placeholders exist:

### Loyalty

Defer:

- production points ledger
- earning/redemption engine
- expiry automation
- loyalty campaigns

A future adapter/model may be scaffolded only when useful, but it must be clearly marked deferred.

### Marketing / campaign / segment engine

Defer:

- production segmentation engine
- campaign automation
- campaign execution
- attribution engine
- automated reactivation campaigns

Phase D may expose reactivation candidates as an intelligence/read result and create a follow-up task, but it must not pretend that a complete campaign engine exists.

### Real WhatsApp provider wiring

Defer actual provider delivery unless a verified provider configuration already exists in the target staging environment.

Phase D may ship:

- provider-neutral notification interface
- message templates
- delivery state model
- audit/event records
- safe adapter/stub
- explicit `not_configured` / `queued` / `failed` states

It MUST NOT create fake `sent`/`delivered` success states.

---

## 4. RINPO commands must map to what actually ships

### Safe read commands

These should be fully demonstrable:

- business summary
- today's appointments
- empty slots
- staff utilization
- customer history
- reactivation candidates
- revenue summary
- service performance
- pending payments

### Action commands

Only implement commands whose underlying domain action is actually production-ready:

- create appointment
- reschedule appointment
- cancel appointment
- create follow-up task
- create staff task
- create customer note
- issue receipt/invoice when authorized
- send notification through the configured/safe notification adapter

### Deferred commands

Do not expose as executable production actions until Phase E:

- create/launch marketing campaign
- automatic customer segmentation
- loyalty point manipulation
- production WhatsApp delivery where provider is not configured

If a user asks for a deferred action, RINPO should explain that the capability is not yet enabled rather than simulate execution.

---

## 5. Acceptance test

The primary Phase D demonstration is:

> **RINPO, check R GLOW and tell me what needs attention.**

Expected flow:

```text
Natural-language command
        ↓
Deterministic intent interpreter
        ↓
Tenant/context resolution
        ↓
Permission
        ↓
Policy
        ↓
Read tools
        ↓
Evidence-backed summary
        ↓
Recommended actions
```

Then:

> **Do the first three.**

Expected behavior:

```text
Requested actions
        ↓
Authorization
        ↓
Approval where required
        ↓
Domain transaction
        ↓
Event
        ↓
Audit
        ↓
Result
```

No fabricated AI reasoning, fake provider delivery, or unverified financial effects are acceptable.

---

## 6. Engineering priority order

1. Stabilize existing Phase C foundation.
2. Complete booking/appointment lifecycle.
3. Implement server-authoritative POS/payment/invoice path.
4. Implement customer history and operational intelligence queries.
5. Implement deterministic RINPO intent interpretation.
6. Connect RINPO to authorized read/action tools.
7. Add notification abstraction and safe delivery states.
8. Run security, tenancy, concurrency, payment, and authorization tests.
9. Deploy to staging through Vercel Preview.
10. Human-verify the end-to-end vertical slice.
11. Document Phase E separately.

Do not expand scope merely because a subsystem appears in the master architecture.

## Rule

**Depth before breadth. One real operating loop is more valuable than six incomplete subsystems.**
