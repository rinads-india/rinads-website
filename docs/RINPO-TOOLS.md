# RINPO Tools Registry

Intelligence layer tool definitions in `@rinads/intelligence`.

## Categories

| Category | Behavior |
|----------|----------|
| `READ` | Safe queries; no mutations |
| `DRAFT` | Creates draft state; requires user confirmation to commit |
| `ACTION` | Executes after explicit confirmation |

Registry: `packages/intelligence/src/registry.ts` · Execution: `executeRinpoTool()` in `tools.ts`.

## Customer-facing tools

| Key | Category | Description |
|-----|----------|-------------|
| `similar_products` | READ | Related catalog products |
| `compare_variants` | READ | Variant comparison |
| `add_to_cart` | DRAFT | Add variant to cart |
| `order_status` | READ | Order tracking |
| `create_ticket` | DRAFT | Support ticket |

## Owner-only tools

Require `ops` services bundle and typically `org.manage`:

| Key | Category | Description |
|-----|----------|-------------|
| `ops_daily_briefing` | READ | Queue, low stock, PO, returns, fulfilment summary |
| `ops_low_stock` | READ | Low-stock SKU list |
| `ops_pending_po` | READ | POs awaiting approval |
| `ops_propose_adjustment` | DRAFT | Inventory adjustment proposal |
| `ops_confirm_proposal` | ACTION | Execute confirmed adjustment + audit |

## API

```typescript
listRinpoTools({ ownerOnly?: boolean; customerFacing?: boolean });
getRinpoTool(key);
isRegisteredRinpoTool(key);
executeRinpoTool(services, ctx, { tool, args }, ops?);
```

Unregistered tools return `{ ok: false, message: "Unknown tool." }`.

## Distinction from runtime actions

| Layer | Package | Purpose |
|-------|---------|---------|
| RINPO tools | `@rinads/intelligence` | Advisory / draft / confirmed ops for chat UI |
| Runtime actions | `@rinads/runtime` | Workflow step side effects with risk levels |

RINPO does not call `registerAction` handlers directly for customer flows.

## Tests

`packages/intelligence/tests/tools.test.ts` — hard limits, registry categories, owner tool filtering.

## Related

- [RINPO-AUTONOMY.md](./RINPO-AUTONOMY.md)
- [RINPO-OPERATIONS.md](./RINPO-OPERATIONS.md)
