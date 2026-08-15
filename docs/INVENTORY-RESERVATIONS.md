# Inventory Reservations

Reservations prevent overselling during checkout.

## Lifecycle

1. **Checkout start** — `reserveForCart(cartId, lines)` creates active reservations (30 min TTL)
2. **Payment success** — `convertReservationToSale(cartId, orderId)` writes sale movements
3. **Payment failure** — `releaseCartReservations(cartId)`
4. **Expiry** — runtime `reservation_expiry` processor marks expired reservations

## Idempotency

Duplicate reservation for same cart replaces prior active reservations for that cart.

## Database

`inventory_reservations` extended with `location_id`, `order_id`, `status`.
