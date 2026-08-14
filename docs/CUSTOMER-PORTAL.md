# Customer portal (Phase 09)

## App

`apps/customer-portal` — authenticated customer account (port 3002).

## Routes

| Route | Data source |
|---|---|
| `/` | Recent order + personalization recommendations |
| `/orders` | `OrderService.listForCustomer` |
| `/orders/[id]` | Order detail + timeline (IDOR guard) |
| `/addresses` | Store addresses for demo customer |
| `/wishlist` | Wishlist rows (empty state when none) |
| `/profile` | `CustomerProfile` |
| `/support` | Tickets + create form |

## RINPO

`RouteAwareRinpoPanel` injects route context (`orderId`, etc.) and exposes tools: order status, create ticket. Cannot submit payment.

## Security

All order/ticket reads pass `DEMO_CUSTOMER_ID` to domain services for IDOR prevention.
