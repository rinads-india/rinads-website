# Procurement

Procurement path: **Supplier → PO → Approval → Goods Receipt → Inventory**

## Services

- `SupplierService` — supplier master + product mapping
- `PurchaseOrderService` — PO lifecycle + approval rules
- `GoodsReceiptService` — partial receiving, damaged/short quantities

## Approval rules

Configurable per org in `purchase_approval_rules` — not hardcoded in UI.

## COGS / valuation

Cost captured on PO lines and receipts. Formal accounting deferred — document method before implementing GL.

See also: [SUPPLIERS.md](./SUPPLIERS.md), [PURCHASE-ORDERS.md](./PURCHASE-ORDERS.md), [GOODS-RECEIPTS.md](./GOODS-RECEIPTS.md)
