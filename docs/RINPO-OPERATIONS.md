# RINPO Operations

RINPO reads operational data with tenant/role context. Write tools use **proposal → confirmation → execution → audit**.

## Read tools

- `ops_daily_briefing` — queue, low stock, pending PO, returns, fulfilment
- `ops_low_stock` — reorder recommendations
- `ops_pending_po` — approval queue

## Write flow

- `ops_propose_adjustment` — creates pending proposal
- `ops_confirm_proposal` — executes adjustment + audit log

Hard limits: `canAdjustInventory: false` without confirmation tool.
