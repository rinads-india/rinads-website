# Refunds

Refunds are **separate financial events** — never mutate historical `order.grandTotal`.

Statuses: `pending → approved → processed`

Requires approval before processing. Linked to return requests when applicable.

Service: `RefundService` in `@rinads/operations`
