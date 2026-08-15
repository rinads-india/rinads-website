# RINPO Autonomy

Advisory intelligence with hard limits — RINPO never bypasses human or runtime gates for customer-facing commerce.

## Advisory layer

RINPO (`@rinads/intelligence`) is a **tool-calling assistant**, not an autonomous agent:

- **READ** tools answer questions from live services (catalog, orders, ops queue)
- **DRAFT** tools prepare mutations (cart line, ticket, inventory proposal) without final commit
- **ACTION** tools execute only after explicit user confirmation (`ops_confirm_proposal`)

Proposal flow for writes:

```
ops_propose_adjustment → pending proposal (in-memory Map)
ops_confirm_proposal → ledger.adjustStock + audit log
```

## Hard limits

`RINPO_HARD_LIMITS` in `packages/intelligence/src/types.ts`:

| Limit | Value | Effect |
|-------|-------|--------|
| `canSubmitPayment` | `false` | No payment submission |
| `canBypassConfirmation` | `false` | No silent ACTION execution |
| `canOverrideShippingTax` | `false` | No pricing overrides |
| `canAdjustInventory` | `false` | Adjustments require confirm tool |

Exposed in `buildRinpoContext()` as `limits` for UI enforcement.

## No direct execution for customers

Customer tools (`add_to_cart`, `create_ticket`) call commerce services in-process — they do **not**:

- Trigger runtime workflows
- Enqueue durable jobs
- Call runtime action registry
- Process refunds or fulfilment

Checkout and fulfilment remain on the commerce/runtime path (`handleOrderPaid` → workflow).

## Owner vs customer

- Customer chat: READ + DRAFT only (no `ops_*` tools without ops bundle)
- Owner portal: full ops tool set when `RinpoOpsServices` provided
- Runtime approvals (`/approvals`) are separate from RINPO proposals

## Memory

DB table `rinpo_memory_facts` (migration) stores tenant facts. Website still uses `useRinpoMemory.ts` localStorage bridge — Supabase hydration **partial**.

## Related

- [RINPO-TOOLS.md](./RINPO-TOOLS.md)
- [APPROVAL-ENGINE.md](./APPROVAL-ENGINE.md) — runtime workflow gates
- ADR-008/009 — no LLM gateway in Phase 12
